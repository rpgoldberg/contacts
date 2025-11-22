# Production Dockerfile for Coolify deployment
# Webapp served on port 80 for Traefik routing to contacts.mindsignals1.com

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

COPY webapp/package.json webapp/package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY webapp/ .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache wget
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

# Coolify expects port 80
EXPOSE 80

ENV PORT=80
ENV HOSTNAME="0.0.0.0"
# Set BACKEND_URL in Coolify to point to backend container
# e.g., http://backend-container:80
ENV BACKEND_URL=http://localhost:8000

CMD ["node", "server.js"]
