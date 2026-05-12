#!/bin/sh
set -e

echo "🚀 Starting Entrypoint Script..."

# Optimize Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Wait for DB to be ready
echo "⏳ Waiting for database connection..."
until php artisan db:monitor --databases=pgsql; do
  echo "Retrying DB connection..."
  sleep 2
done

# Run migrations
echo "📂 Running migrations..."
php artisan migrate --force

# Start PHP-FPM in background
echo "🐘 Starting PHP-FPM..."
php-fpm -D

# Start SSR Server in background (if needed)
echo "⚛️ Starting Inertia SSR..."
php artisan inertia:start-ssr &

# Start Nginx in FOREGROUND to keep container alive
echo "🌐 Starting Nginx..."
nginx -g "daemon off;"
