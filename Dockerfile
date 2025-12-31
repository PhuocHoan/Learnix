FROM node:24-alpine AS base

# The web Dockerfile is copy-pasted into our main docs at /docs/handbook/deploying-with-docker.
# Make sure you update this Dockerfile, the Dockerfile in the web workspace and copy that over to Dockerfile in the docs.

FROM base AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @repo/web @repo/api --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
RUN npm install -g pnpm
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

# ARG to determine which app to build/start (web or api)
ARG APP_NAME=web
ENV APP_NAME=${APP_NAME}

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Check if build script is defined, if not, try to build with turbo
RUN npx turbo build --filter=@repo/${APP_NAME}...

FROM base AS runner
WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=installer --chown=nextjs:nodejs /app .

# Install serve globally for static site serving (web)
RUN npm install -g serve

USER nextjs

# Expose port (default 3000)
EXPOSE 3000

# Start command depends on APP_NAME
CMD if [ "$APP_NAME" = "web" ]; then \
  serve -s apps/web/dist -l 3000; \
  else \
  node apps/api/dist/main.js; \
  fi
