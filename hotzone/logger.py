import logging
import os

logger = logging.getLogger("frawatch.hotzone")
handler = logging.StreamHandler()
formatter = logging.Formatter(
    "[%(asctime)s] [%(levelname)s] [%(name)s] — %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
logger.setLevel(
    getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)
)
