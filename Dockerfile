# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY src/dashboard/package*.json ./
RUN npm install
COPY src/dashboard/ ./
RUN npm run build

# Stage 2: Build Backend
FROM python:3.10-slim AS backend
WORKDIR /app
# Install build dependencies for xgboost and scikit-learn
RUN apt-get update && apt-get install -y build-essential libgomp1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 8000
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
