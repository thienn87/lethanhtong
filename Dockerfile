FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    build-essential \
    software-properties-common \
    apt-utils \
    && docker-php-ext-configure zip \
    && docker-php-ext-install zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN chmod +x /usr/bin/composer

# Install MySQL PDO extension
RUN docker-php-ext-install pdo_mysql

# Install PostgreSQL PDO extension, native PostgreSQL extensions and client tools
RUN apt-get install -y libpq-dev postgresql-client \
    && docker-php-ext-install pdo pdo_pgsql pgsql

RUN apt-get install -y fonts-liberation
RUN apt-get install -y gconf-service
RUN apt-get install -y libappindicator1
RUN apt-get install -y libjpeg62
RUN apt-get install -y libasound2
RUN apt-get install -y libatk1.0-0
RUN apt-get install -y libcairo2
RUN apt-get install -y libcups2
RUN apt-get install -y libfontconfig1
RUN apt-get install -y libgbm-dev
RUN apt-get install -y libgdk-pixbuf2.0-0
RUN apt-get install -y libgtk-3-0
RUN apt-get install -y libicu-dev
RUN apt-get install -y libjpeg-dev
RUN apt-get install -y libnspr4
RUN apt-get install -y libnss3
RUN apt-get install -y libpango-1.0-0
RUN apt-get install -y libpangocairo-1.0-0
RUN apt-get install -y libpng-dev
RUN apt-get install -y libx11-6
RUN apt-get install -y libx11-xcb1
RUN apt-get install -y libxcb1
RUN apt-get install -y libxcomposite1
RUN apt-get install -y libxcursor1
RUN apt-get install -y libxdamage1
RUN apt-get install -y libxext6
RUN apt-get install -y libxfixes3
RUN apt-get install -y libxi6
RUN apt-get install -y libxrandr2
RUN apt-get install -y libxrender1
RUN apt-get install -y libxss1
RUN apt-get install -y libxtst6
RUN apt-get install -y xdg-utils
RUN docker-php-ext-install gd
RUN apt install sqlite3 libsqlite3-dev

# Set working directory
WORKDIR /var/www/html

# Copy existing application directory contents
COPY ./backend /var/www/html
COPY ./docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Make entrypoint script executable
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set permissions
RUN chown -R www-data:www-data /var/www/html

# Expose port 9000
EXPOSE 9000

# Set entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Start PHP server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=9000"]
