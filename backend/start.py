#!/usr/bin/env python3
"""
Simple startup script for ML Benchmark API
This script provides a more stable way to start the development server
"""

import uvicorn
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def main():
    """Start the FastAPI server with optimized settings"""

    # Configuration
    config = {
        "app": "main:app",
        "host": "0.0.0.0",
        "port": 8000,
        "log_level": "info",
        "access_log": True,
        "use_colors": True,
    }

    # Development vs Production settings
    if os.getenv("ENV", "development") == "development":
        config.update({
            "reload": True,
            "reload_dirs": [str(backend_dir)],
            "reload_includes": ["*.py"],
            "reload_excludes": [
                "__pycache__/*",
                "*.pyc",
                "*.pyo",
                "*.log",
                ".git/*",
                "venv/*",
                ".venv/*",
                "node_modules/*"
            ],
            "workers": 1  # Must be 1 for reload
        })
    else:
        config.update({
            "reload": False,
            "workers": 4
        })

    print("🚀 Starting ML Benchmark API Server...")
    print(f"📍 Server will be available at: http://{config['host']}:{config['port']}")
    print(f"📚 API Documentation: http://{config['host']}:{config['port']}/docs")
    print(f"🔄 Reload enabled: {config.get('reload', False)}")
    print("-" * 50)

    try:
        uvicorn.run(**config)
    except KeyboardInterrupt:
        print("\n🛑 Server shutdown requested by user")
    except Exception as e:
        print(f"❌ Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
