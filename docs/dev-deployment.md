# Developer Deployment Guide

This document provides step-by-step instructions for deploying the School Management System for development purposes. It covers both local and Docker-based deployment for backend (Laravel) and frontend (React).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
  - [Backend (Laravel)](#backend-laravel)
  - [Frontend (React)](#frontend-react)
- [Docker Deployment](#docker-deployment)
- [Environment Variables](#environment-variables)
- [Common Issues](#common-issues)
- [Useful Commands](#useful-commands)

---

## Prerequisites

Ensure you have the following installed:

- **Node.js** (v16+)
- **npm** (v8+)
- **PHP** (v8.1+)
- **Composer**
- **SQLite** (or your preferred DB)
- **Docker** & **Docker Compose** (for containerized deployment)
- **Git**

---

## Local Deployment

### Backend (Laravel)

1. **Clone the repository** and navigate to the backend directory:
    ```bash
    git clone <your-repo-url>
    cd backend
    ```

2. **Install PHP dependencies:**
    ```bash
    composer install
    ```

3. **Copy and configure environment variables:**
    ```bash
    cp .env.example .env
    # Edit .env as needed (DB, APP_KEY, etc.)
    ```

4. **Generate application key:**
    ```bash
    php artisan key:generate
    ```

5. **Set up the database:**
    - For SQLite:
      ```bash
      touch database/database.sqlite
      # Ensure DB_CONNECTION=sqlite and DB_DATABASE=/absolute/path/to/database.sqlite in .env
      ```
    - For MySQL/Postgres: configure `.env` accordingly.

6. **Run migrations and seeders:**
    ```bash
    php artisan migrate --seed
    ```

7. **Start the backend server:**
    ```bash
    php artisan serve
    ```
    The backend will be available at [http://localhost:8000](http://localhost:8000).

---

### Frontend (React)

1. **Navigate to the frontend directory:**
    ```bash
    cd ../frontend
    ```

2. **Install Node dependencies:**
    ```bash
    npm install
    ```

3. **Configure environment variables:**
    - Copy `.env.example` to `.env` if present.
    - Set `VITE_API_BASE_URL` to your backend URL (e.g., `http://localhost:8000/api`).

4. **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will be available at [http://localhost:3000](http://localhost:3000).

---

## Docker Deployment

1. **Ensure Docker and Docker Compose are installed.**

2. **From the project root, run:**
    ```bash
    docker-compose up -d --build
    ```

3. **Access the application:**
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend: [http://localhost](http://localhost)

4. **Running migrations inside the backend container:**
    ```bash
    docker-compose exec backend php artisan migrate --seed
    ```

---

## Environment Variables

- **Backend:** Edit `backend/.env` for DB, APP_KEY, etc.
- **Frontend:** Edit `frontend/.env` for `VITE_API_BASE_URL`.

---

## Common Issues

- **Port conflicts:** Ensure ports 3000 (frontend) and 8000 (backend) are free.
- **Database errors:** Check DB config in `.env` files.
- **Permission issues:** For SQLite, ensure the `database` directory is writable.

---

## Useful Commands

- **Backend**
    - Run tests: `php artisan test`
    - Run migrations: `php artisan migrate`
    - Seed DB: `php artisan db:seed`
- **Frontend**
    - Run tests: `npm test`
    - Build for production: `npm run build`

---

## Notes

- For production deployment, further configuration and security hardening are required.
- Always keep your `.env` files secure and never commit them to version control.

---

This guide is intended for developer use only. For further assistance, contact the project maintainers.