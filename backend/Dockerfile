FROM python:3.12-slim

WORKDIR /app

RUN ln -s /app /backend

# Install system build dependencies (e.g. for building any compiled deps if needed)
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt email-validator pytest httpx

# Copy the rest of the application
COPY . .

EXPOSE 8000

# Run the app using uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
