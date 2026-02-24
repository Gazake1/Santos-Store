# Santos Store - Dockerfile
# Node 20 + Alpine with native build tools for better-sqlite3

FROM node:20-alpine

# Install native build tools (needed for better-sqlite3)
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci
RUN npm rebuild better-sqlite3 --build-from-source

# Copy source code
COPY . .

# Build Next.js
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Create persistent data directories
RUN mkdir -p uploads data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
