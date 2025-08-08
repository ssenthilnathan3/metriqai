#!/bin/bash

# Start Nginx in background
nginx -g 'daemon off;' &

# Wait for Nginx to start
sleep 2

# Change to backend directory
cd /app/backend

# Start FastAPI application with uvicorn
uvicorn main:app \
    --host ${HOST:-0.0.0.0} \
    --port ${PORT:-8000} \
    --workers ${WORKERS:-4} \
    --proxy-headers \
    --forwarded-allow-ips='*'

# Keep container running
wait
