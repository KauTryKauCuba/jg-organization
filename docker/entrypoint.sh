#!/bin/sh
set -e

echo "🚀 Starting Entrypoint Script..."

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Wait for DB to be ready using PHP's built-in capability
echo "⏳ Waiting for database connection (db:5432)..."
php -r "while(!@fsockopen('db', 5432)) { echo 'Waiting for DB...'; sleep(2); }"

# Run migrations
echo "📂 Running migrations..."
php artisan migrate --force

# Start PHP-FPM in background
echo "🐘 Starting PHP-FPM..."
php-fpm -D

# Start SSR Server in background
echo "⚛️ Starting Inertia SSR..."
php artisan inertia:start-ssr &

# Start Nginx in FOREGROUND to keep container alive
echo "🌐 Starting Nginx on port 8003..."
nginx -g "daemon off;"
