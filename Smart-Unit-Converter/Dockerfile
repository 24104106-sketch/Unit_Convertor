# Stage 1: Build React application
FROM node:22-alpine AS build
# Set working directory
WORKDIR /app
# Copy package files first
COPY package*.json ./
# Install dependencies
RUN npm ci
# Copy project files
COPY . .
# Build React/Vite application
RUN npm run build
# Stage 2: Serve using Nginx
FROM nginx:alpine
# Remove default nginx files
RUN rm -rf /usr/share/nginx/html/*
# Copy React build files
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx listens on port 80 by default
EXPOSE 80
# Start nginx
CMD ["nginx", "-g", "daemon off;"]