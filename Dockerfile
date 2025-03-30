FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY frontend/ ./
# Make sure build script runs in non-interactive mode
RUN CI=true pnpm build

FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy GeoIP database
COPY geodata/GeoLite2-City.mmdb /app/GeoLite2-City.mmdb
ENV GEOIP_DB_PATH=/app/GeoLite2-City.mmdb

# Copy backend code
COPY backend/ /app/

# Copy frontend build from the previous stage
COPY --from=frontend-builder /app/frontend/dist /app/static

EXPOSE 8000

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
