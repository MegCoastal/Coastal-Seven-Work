#!/bin/sh

# Start Celery worker in the background
echo "Starting Celery background worker..."
celery -A app.celery_app.celery worker --loglevel=info &

# Start Uvicorn web server in the foreground, binding to the PORT variable injected by Render
echo "Starting Uvicorn web server on port ${PORT:-8000}..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
