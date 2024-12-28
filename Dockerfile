# Build stage
ARG NODE_VERSION=18.17.0
FROM node:${NODE_VERSION}-alpine AS build-image

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy only package.json, package-lock.json, and pnpm-lock.yaml to leverage Docker cache
COPY package.json pnpm-lock.yaml ./

COPY prisma ./prisma/

# Install dependencies
RUN pnpm install

# Prisma migration and generate
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY . .

EXPOSE 8065

# Set the command to run the NestJS application
CMD ["pnpm", "run", "start:prod"]
