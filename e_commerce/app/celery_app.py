import time
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import Celery
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

celery = Celery(
    "tasks",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery.task
def send_confirmation_email_task(order_id: int, email: str, total_amount: float):
    # Check if SMTP configuration is set up
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or not settings.SMTP_FROM_EMAIL:
        logger.warning(
            "SMTP credentials not fully configured in environment settings. "
            f"Simulating order confirmation email in terminal:\n"
            f"==================================================\n"
            f"TO: {email}\n"
            f"SUBJECT: Order Confirmation - Order #{order_id}\n"
            f"BODY: Thank you for your purchase of Rs.{total_amount:.2f}!\n"
            f"=================================================="
        )
        time.sleep(2)
        logger.info(f"SUCCESS: Simulated email send completed to {email}!")
        return f"Simulated email sent to {email}"

    try:
        # Create standard MIME container
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"Order Confirmation - Order #{order_id}"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = email

        # HTML template body
        html_content = f"""
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <div style="background-color: #0ea5e9; padding: 20px; text-align: center; border-radius: 6px 6px 0 0;">
              <h1 style="color: #ffffff; margin: 0;">Order Confirmed!</h1>
            </div>
            <div style="padding: 20px;">
              <p>Hi there,</p>
              <p>Thank you for shopping with us! We have successfully received your order.</p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <h3 style="color: #0f172a; margin-top: 0;">Order Summary:</h3>
              <p><strong>Order ID:</strong> #{order_id}</p>
              <p><strong>Total Amount:</strong> Rs.{total_amount:.2f}</p>
              <p>We are preparing your items for shipment. We will send you updates once your order status changes.</p>
            </div>
            <div style="text-align: center; padding: 20px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 20px;">
              <p>© 2026 Ocean E-Commerce. All rights reserved.</p>
            </div>
          </body>
        </html>
        """
        msg.attach(MIMEText(html_content, "html"))

        # Connect and send
        logger.info(f"Connecting to SMTP server at {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        
        logger.info("Logging in to SMTP server...")
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        
        logger.info(f"Sending HTML confirmation email to {email}...")
        server.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())
        server.quit()
        
        logger.info(f"SUCCESS: Order confirmation email sent successfully to {email} for Order #{order_id}!")
        return f"Email sent successfully to {email}"
    except Exception as e:
        logger.error(f"FAILURE: Failed to send SMTP email to {email} for Order #{order_id}: {e}")
        raise e

@celery.task
def generate_product_description_task(product_id: int):
    from app.database import SessionLocal
    from app.models.products import Product
    from app.services.vector_store import get_embedding
    from app.models.product_embeddings import ProductEmbedding
    from openai import OpenAI
    import json
    import os

    db = SessionLocal()
    try:
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            logger.error(f"Product {product_id} not found for description generation.")
            return

        # Setup failover client
        providers = [
            (settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODEL),
            (os.getenv("GEMINI_API_KEY"), "https://generativelanguage.googleapis.com/v1beta/openai/", "gemini-1.5-flash"),
            (os.getenv("MISTRAL_API_KEY"), "https://api.mistral.ai/v1", "mistral-small-latest")
        ]
        active_providers = [p for p in providers if p[0] and p[0] != "your_key_here" and p[0].strip()]

        if not active_providers:
            logger.warning("No active LLM providers for description generation.")
            return

        prompt = (
            f"Write a clean, professional, and appealing 3-sentence e-commerce product description "
            f"for a product in the category '{product.category}' named '{product.name}'. "
            "Return only the description itself."
        )

        description = ""
        for api_key, base_url, model in active_providers:
            try:
                client = OpenAI(api_key=api_key, base_url=base_url)
                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=150
                )
                description = completion.choices[0].message.content.strip()
                break
            except Exception as ex:
                logger.warning(f"Failed to generate description on model {model}: {ex}")

        if description:
            product.description = description
            db.commit()
            logger.info(f"Generated description for product {product_id}: {description}")
            
            # Run embedding generation for product locally (sync run inside task context)
            import asyncio
            text_payload = f"Category: {product.category}. Product: {product.name}. Description: {product.description}"
            loop = asyncio.get_event_loop()
            vector = loop.run_until_complete(get_embedding(text_payload))
            
            existing = db.query(ProductEmbedding).filter(ProductEmbedding.product_id == product_id).first()
            if existing:
                existing.vector = json.dumps(vector)
            else:
                db.add(ProductEmbedding(product_id=product_id, vector=json.dumps(vector)))
            db.commit()
            logger.info(f"Re-indexed product {product_id} vector embeddings.")
    except Exception as e:
        logger.error(f"Failed description generation task: {e}")
        db.rollback()
    finally:
        db.close()

@celery.task
def moderate_review_task(review_id: int):
    from app.database import SessionLocal
    from app.models.reviews import Review
    from openai import OpenAI
    import os

    db = SessionLocal()
    try:
        review = db.query(Review).filter(Review.id == review_id).first()
        if not review:
            logger.error(f"Review {review_id} not found for moderation.")
            return

        # Setup failover client
        providers = [
            (settings.LLM_API_KEY, settings.LLM_BASE_URL, settings.LLM_MODEL),
            (os.getenv("GEMINI_API_KEY"), "https://generativelanguage.googleapis.com/v1beta/openai/", "gemini-1.5-flash"),
            (os.getenv("MISTRAL_API_KEY"), "https://api.mistral.ai/v1", "mistral-small-latest")
        ]
        active_providers = [p for p in providers if p[0] and p[0] != "your_key_here" and p[0].strip()]

        if not active_providers:
            # Fallback if no LLM: approve review
            review.status = "approved"
            db.commit()
            logger.warning("No LLM key configured. Review approved automatically.")
            return

        prompt = (
            "Classify this e-commerce product review comment.\n"
            f"Review Comment: \"{review.comment}\"\n\n"
            "Reply with exactly one word:\n"
            "- 'toxic' if it contains heavy profanity, vulgarity, abuse, or hate speech.\n"
            "- 'spam' if it is advertising links or commercial spam.\n"
            "- 'clean' if it is a normal review.\n"
            "Reply with only: toxic, spam, or clean."
        )

        classification = "clean"
        for api_key, base_url, model in active_providers:
            try:
                client = OpenAI(api_key=api_key, base_url=base_url)
                completion = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=10
                )
                classification = completion.choices[0].message.content.strip().lower()
                break
            except Exception as ex:
                logger.warning(f"Failed to moderate on model {model}: {ex}")

        if "toxic" in classification:
            review.status = "flagged"
            logger.info(f"Review {review_id} flagged as toxic.")
        elif "spam" in classification:
            review.status = "flagged"
            logger.info(f"Review {review_id} flagged as spam.")
        else:
            review.status = "approved"
            logger.info(f"Review {review_id} approved successfully.")
        db.commit()
    except Exception as e:
        logger.error(f"Moderation task error: {e}")
        db.rollback()
    finally:
        db.close()
