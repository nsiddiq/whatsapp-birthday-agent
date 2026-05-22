FROM node:20

WORKDIR /app

# Copy package files
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies
RUN npm install

# Copy source code
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Build frontend
RUN npm run --workspace=frontend build

# Serve frontend static files from backend
RUN cp -r frontend/dist backend/public

EXPOSE 3001

CMD ["node", "backend/server.js"]
