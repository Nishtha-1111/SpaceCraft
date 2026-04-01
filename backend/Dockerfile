FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV / image processing
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better cache layering
COPY requirements.txt .

# Install Python dependencies (CPU-only torch to keep image small)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir ultralytics fastapi uvicorn[standard] python-multipart pillow

# Copy the rest of the backend
COPY . .

# Hugging Face Spaces uses port 7860
EXPOSE 7860

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "7860"]
