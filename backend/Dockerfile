# Use Python 3.11 slim as the base image
FROM python:3.13 AS py

# Install necessary system dependencies including curl for downloading uv
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN pip install uv

# Copy requirements file
COPY /backend/requirements.txt /backend/requirements.txt

# Install dependencies using uv
RUN python -m uv pip install --system -r /backend/requirements.txt

# Copy the rest of the application
COPY . .

# Command to run the application
CMD ["python", "app.py"]
