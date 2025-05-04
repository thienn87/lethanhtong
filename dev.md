# Development Documentation

This document provides technical details and guidelines for developers working on the School Management System project.

---

## Project Structure

### Backend
- **Framework**: Laravel
- **Key Files**:
  - `artisan`: Laravel CLI tool for managing the application.
  - `composer.json`: Defines backend dependencies.
  - `config/database.php`: Database configuration file.
  - `.env`: Environment variables for the backend.

### Frontend
- **Framework**: React.js
- **Styling**: Tailwind CSS
- **Key Files**:
  - `src/`: Contains React components and application logic.
  - `package.json`: Defines frontend dependencies.
  - `vite.config.js`: Configuration for the Vite build tool.

---

## Development Setup

### Prerequisites
Ensure the following tools are installed:
- **Node.js** (v16 or higher)
- **PHP** (v8.1 or higher)
- **Composer**
- **SQLite**
- **Docker** and **Docker Compose**

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   composer install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Generate the application key:
   ```bash
   php artisan key:generate
   ```
5. Set up the SQLite database:
   ```bash
   touch database/database.sqlite
   ```
6. Run database migrations:
   ```bash
   php artisan migrate
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

---

## Development Workflow

### Backend
- Start the Laravel development server:
  ```bash
  php artisan serve
  ```
- Run database migrations:
  ```bash
  php artisan migrate
  ```
- Seed the database:
  ```bash
  php artisan db:seed
  ```

### Frontend
- Start the React development server:
  ```bash
  npm start
  ```
- Build the production-ready frontend:
  ```bash
  npm run build
  ```

---

## Testing

### Backend
- Use PHPUnit for testing:
  ```bash
  php artisan test
  ```

### Frontend
- Use React Testing Library for testing:
  ```bash
  npm test
  ```

---

## API Endpoints

The backend exposes RESTful APIs for the frontend to consume. Refer to the `routes/api.php` file for endpoint definitions. Example endpoints include:
- `GET /api/students`: Fetch all students.
- `POST /api/students`: Add a new student.
- `PUT /api/students/{id}`: Update a student's details.
- `DELETE /api/students/{id}`: Delete a student.

---

## Environment Variables

### Backend
- Update the `.env` file in the `backend` directory to configure:
  - Database connection (`DB_CONNECTION`, `DB_DATABASE`).
  - Application key (`APP_KEY`).

### Frontend
- Update the `.env` file in the `frontend` directory to configure:
  - API base URL (`VITE_API_BASE_URL`).

---

## Docker Setup

1. Build and start the containers:
   ```bash
   docker-compose up -d
   ```
2. Access the application:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost](http://localhost)

---

## Additional Notes

- **Code Formatting**: Use Prettier for frontend code and PHP CS Fixer for backend code.
- **Version Control**: Follow Git best practices (e.g., feature branches, meaningful commit messages).
- **Error Handling**: Use Laravel's built-in exception handling and React error boundaries.

---

## Contribution Guidelines

1. Fork the repository and create a feature branch.
2. Write clear and concise commit messages.
3. Ensure all tests pass before submitting a pull request.
4. Follow the coding standards defined for the project.

---

This document serves as a guide for developers to set up, run, and contribute to the project effectively.