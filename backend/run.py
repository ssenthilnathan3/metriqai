#!/usr/bin/env python3
"""
ML Benchmark API Server Startup Script

This script starts the FastAPI server for the ML Benchmark visualization application.
It handles environment setup, logging configuration, and server initialization.
"""

import os
import sys
import uvicorn
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('ml_benchmark_api.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main function to start the FastAPI server"""

    # Server configuration
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("RELOAD", "true").lower() == "true"
    workers = int(os.getenv("WORKERS", "1"))

    logger.info("Starting ML Benchmark API Server...")
    logger.info(f"Host: {host}")
    logger.info(f"Port: {port}")
    logger.info(f"Reload: {reload}")
    logger.info(f"Workers: {workers}")

    try:
        # Start the server with better configuration
        uvicorn.run(
            "main:app",
            host=host,
            port=port,
            reload=reload,
            workers=workers if not reload else 1,  # Can't use workers with reload
            log_level="info",
            access_log=True,
            reload_includes=["*.py"] if reload else None,
            reload_excludes=["__pycache__", "*.pyc", ".git", "venv", ".venv"] if reload else None,
            use_colors=True
        )
    except KeyboardInterrupt:
        logger.info("Server shutdown requested by user")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
