# Use full Node.js LTS as the base image
FROM node:20 AS base

# Set working directory
WORKDIR /app

# Dependencies stage
FROM base AS deps

# Copy package.json and package-lock.json (or yarn.lock if using yarn)
COPY package.json package-lock.json* ./

# Install dependencies - add --force flag to handle dependency conflicts
RUN npm ci --force

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line to disable telemetry during runtime
# ENV NEXT_TELEMETRY_DISABLED 1

# Copy built files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set port
EXPOSE 3000

# Environment variables must be redefined at run time
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Command to run the app
CMD ["node", "server.js"]