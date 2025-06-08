# Stage 1: Build the application
FROM node:20 as builder

WORKDIR /app
RUN apt-get update && apt-get install -y openssl

COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20 as production

WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 5000
CMD ["npm", "start"]
