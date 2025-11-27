Here is a Dockerfile that meets your requirements:

```Dockerfile
# ---- Base Node ----
FROM node:20-alpine AS base
# Set working directory
WORKDIR /app
# Copy project file
COPY package.json .

# ---- Dependencies ----
FROM base AS dependencies
# Install production and development dependencies
RUN npm install
# Copy app sources
COPY . .
# Build TypeScript
RUN npm run build

# ---- Test ----
# Run linters, setup and tests
FROM dependencies AS test
COPY . .
RUN npm run test

# ---- Release ----
FROM base AS release
# Copy production dependencies
COPY --from=dependencies /app/node_modules ./node_modules
# Copy app build (dist/)
COPY --from=dependencies /app/dist ./dist
# Change to non-root user
USER node
# Expose API port
EXPOSE 3000
# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 CMD node /app/healthcheck.js
# Start application
CMD ["node", "dist/index.js"]
```

And here is a docker-compose.yml file:

```yaml
version: '3.8'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    image: my-api:1.0.0
    restart: always
    user: "node"
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "node", "/app/healthcheck.js"]
      interval: 30s
      timeout: 30s
      start_period: 5s
      retries: 3
```

Please note that you need to create a healthcheck.js file that will return 200 status code when your API is healthy. Also, you need to adjust the paths according to your project structure.