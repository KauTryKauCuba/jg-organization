#!/bin/sh

# Cache configurations for speed
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Run migrations automatically
php artisan migrate --force

# Start PHP-FPM in background
php-fpm -D

# Start Nginx in foreground
nginx -g "daemon off;" &

# Start SSR Server if needed (on port 3003)
php artisan inertia:start-ssr
