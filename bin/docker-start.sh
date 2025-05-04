#!/bin/bash

# Tên container mà bạn muốn kiểm tra
# CONTAINER_NAME="LARAVEL_TURBOSIFY"


# Chạy các lệnh bên trong container
echo "Chạy lệnh php artisan migrate..."
docker exec -it LARAVEL_TURBOSIFY bash -c "php artisan migrate --force"

echo "Xong!"
