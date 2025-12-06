import logging
import sys
from typing import Any

class CustomFormatter(logging.Formatter):
    """
    Custom formatter to output logs in a structured way (or just cleaner text).
    For production, JSON formatting is often preferred, but for this local setup,
    we'll stick to a clean readable format with timestamps.
    """
    grey = "\x1b[38;20m"
    yellow = "\x1b[33;20m"
    red = "\x1b[31;20m"
    bold_red = "\x1b[31;1m"
    reset = "\x1b[0m"
    format_str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: grey + format_str + reset,
        logging.INFO: grey + format_str + reset,
        logging.WARNING: yellow + format_str + reset,
        logging.ERROR: red + format_str + reset,
        logging.CRITICAL: bold_red + format_str + reset
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

def setup_logging():
    """Configures the root logger."""
    from app.core.config import settings
    import os

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # removing default handlers to avoid duplication if re-setup
    if logger.handlers:
        logger.handlers.clear()

    # 1. Console Handler (Conditional)
    if settings.LOG_TO_CONSOLE:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(CustomFormatter())
        logger.addHandler(console_handler)

    # 2. File Handler (Always, if configured)
    if settings.LOG_DIR and settings.LOG_FILENAME:
        try:
            if not os.path.exists(settings.LOG_DIR):
                os.makedirs(settings.LOG_DIR)
            
            file_path = os.path.join(settings.LOG_DIR, settings.LOG_FILENAME)
            # Use a standard formatter for files (no colors)
            file_formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
            file_handler = logging.FileHandler(file_path)
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            # Fallback to printing to stderr if file logging fails (so we don't crash)
            sys.stderr.write(f"Failed to setup file logging: {e}\n")

    # Set level for some noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)

    return logger

logger = setup_logging()
