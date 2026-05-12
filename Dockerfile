# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Install PHP in build stage for Wayfinder plugin
RUN apk add --no-cache php82 php82-cli php82-mbstring php82-xml php82-tokenizer php82-fileinfo php82-json php82-dom php82-xmlwriter \
    && ln -s /usr/bin/php82 /usr/bin/php82-cli || true \
    && ln -sf /usr/bin/php82 /usr/bin/php
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm run build:ssr

# Stage 2: Build Backend
FROM php:8.2-fpm-alpine
WORKDIR /var/www

# Install System Dependencies
RUN apk add --no-cache \
    nginx \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    curl

# Install PHP Extensions
RUN docker-php-ext-install pdo_pgsql mbstring zip bcmath

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy Application code
COPY . .
COPY --from=frontend-builder /app/public/build ./public/build
COPY --from=frontend-builder /app/bootstrap/ssr ./bootstrap/ssr

# Set Permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Expose ports
EXPOSE 8003 3003

# Entrypoint script
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
