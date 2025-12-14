# Multi-stage build for optimized Python backend
FROM python:3.10-slim as builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p /app/uploads /app/logs

# Expose port
EXPOSE 8000

# Install wait-for-it script for database readiness
RUN apt-get update && apt-get install -y netcat-openbsd && rm -rf /var/lib/apt/lists/*

# Create startup script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for MySQL to be ready..."\n\
while ! nc -z mysql 3306; do\n\
  echo "MySQL is unavailable - sleeping"\n\
  sleep 2\n\
done\n\
\n\
echo "MySQL is up - running migrations"\n\
python -c "from app.core.database import Base, engine; Base.metadata.create_all(bind=engine)"\n\
\n\
echo "Starting uvicorn"\n\
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1\n\
' > /app/start.sh && chmod +x /app/start.sh

# Run startup script
CMD ["/bin/bash", "/app/start.sh"]
