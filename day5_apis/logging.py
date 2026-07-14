import structlog
import logging

logging.basicConfig(level=logging.INFO)

logger = structlog.get_logger()

logger.info("product_created", product_id=123)