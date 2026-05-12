# Stage 1: Build Frontend & Assets
FROM php:8.2-fpm-alpine AS frontend-builder
WORKDIR /app

# Install Node.js and System Dependencies for PHP extensions
RUN apk add --no-cache \
    nodejs \
    npm \
    postgresql-dev \
    libzip-dev \
    zip \
    unzip \
    git \
    oniguruma-dev \
    curl

# Install PHP Extensions needed for Artisan commands during build
RUN docker-php-ext-install pdo_pgsql mbstring zip bcmath

COPY . .

# Install dependencies
RUN npm install
RUN npm run build
RUN npm run build:ssr

# Stage 2: Final Production Image
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
# Copy built assets from builder stage
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
