from celery_app import celery
import time

@celery.task
def send_email(email):
    print("TASK STARTED:", email)
    time.sleep(5)
    print("TASK DONE:", email)
    return f"Email sent to {email}"

