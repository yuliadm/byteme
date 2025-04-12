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
COPY ./requirements.txt /backend/requirements.txt

# Install dependencies using uv
RUN python -m uv pip install --system -r /backend/requirements.txt

# Copy the rest of the application
COPY . .

# Create a non-root user
ARG USER_ID=1000
ARG GROUP_ID=1000
ARG USERNAME=appuser

# Create the user and group
RUN groupadd -g ${GROUP_ID} ${USERNAME} && \
    useradd -u ${USER_ID} -g ${GROUP_ID} -m -s /bin/bash ${USERNAME}

# Set ownership for application directory if needed
WORKDIR /app
COPY --chown=${USERNAME}:${USERNAME} . .

# Switch to the non-root user
USER ${USERNAME}