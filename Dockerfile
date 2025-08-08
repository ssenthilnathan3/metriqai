# Use Node.js as base image for frontend build
FROM node:18-alpine as frontend-build

# Set working directory
WORKDIR /app/frontend

# Copy frontend files
COPY frontend/package*.json ./
COPY frontend/ ./

# Install dependencies and build frontend
RUN npm i --legacy-peer-deps
RUN npm ci
RUN npm run build

# Use Python image for backend and serving
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install nginx
RUN apt-get update && apt-get install -y nginx \
    && rm -rf /var/lib/apt/lists/*

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy backend requirements and install dependencies
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend code
COPY backend/ backend/

# Copy built frontend from previous stage
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Copy start script
COPY start.sh /app/
RUN chmod +x /app/start.sh

# Expose ports
EXPOSE 80 8000

# Set environment variables
ENV HOST=0.0.0.0
ENV PORT=8000
ENV WORKERS=4
ENV API_URL=http://localhost:8000

# Start both nginx and backend server
CMD ["/app/start.sh"]
