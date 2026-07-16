import logging
import os
import sys
from datetime import datetime, timezone
from pythonjsonlogger import jsonlogger
from .logging_context import request_id_ctx, user_id_ctx, org_id_ctx

class CorrelationIdJSONFormatter(jsonlogger.JsonFormatter):
    def add_fields(self, log_record, record, message_dict):
        super().add_fields(log_record, record, message_dict)
        
        # Inject standard JSON fields
        log_record["timestamp"] = datetime.now(timezone.utc).isoformat() + "Z"
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["environment"] = os.getenv("ENVIRONMENT", "production")

        # Dynamically inject ContextVar values if set
        req_id = request_id_ctx.get()
        if req_id:
            log_record["request_id"] = req_id
            
        u_id = user_id_ctx.get()
        if u_id:
            log_record["user_id"] = u_id
            
        o_id = org_id_ctx.get()
        if o_id:
            log_record["org_id"] = o_id

        # Extract request metadata fields if present
        for field in ("method", "path", "status_code", "duration_ms"):
            val = message_dict.get(field) or getattr(record, field, None)
            if val is not None:
                log_record[field] = val

        # Clean stack trace / exc_info for JSON consistency
        if record.exc_info:
            log_record["exc_info"] = self.formatException(record.exc_info)

def setup_logging():
    log_level = getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Remove all existing handlers to prevent duplicates
    for handler in list(root_logger.handlers):
        root_logger.removeHandler(handler)
        
    # JSON formatter
    formatter = CorrelationIdJSONFormatter(
        "%(timestamp)s %(level)s %(logger)s %(message)s"
    )
    
    # Add handler to stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)
    root_logger.addHandler(handler)
    
    # Set levels for noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
