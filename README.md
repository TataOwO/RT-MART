# RT-MART

An e-commerce web application built with React (frontend) and NestJS (backend).

## Windows Installation Guide

This guide walks you through setting up RT-MART locally on a Windows machine using Docker.

### Prerequisites

Before you begin, make sure your system meets these requirements:
- Windows 10/11 (64-bit) with WSL2 enabled
- At least 8GB RAM (4GB minimum)
- 10GB free disk space

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**
   - Go to [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
   - Click "Download for Windows"

2. **Install Docker Desktop**
   - Run the downloaded installer (`Docker Desktop Installer.exe`)
   - When prompted, ensure "Use WSL 2 instead of Hyper-V" is selected
   - Click "Ok" to proceed with the installation
   - Restart your computer when prompted

3. **Complete Docker Setup**
   - After restart, Docker Desktop will start automatically
   - Accept the Docker Subscription Service Agreement
   - Wait for Docker to finish starting (the whale icon in the system tray will stop animating)

4. **Verify Docker Installation**
   - Open PowerShell or Command Prompt
   - Run the following command:
     ```powershell
     docker --version
     ```
   - You should see output like: `Docker version 24.x.x, build xxxxxxx`

### Step 2: Install Git (if not already installed)

1. **Download Git**
   - Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - The download should start automatically

2. **Install Git**
   - Run the installer
   - Use the default settings (click "Next" through the installation)
   - Click "Install" and then "Finish"

3. **Verify Git Installation**
   ```powershell
   git --version
   ```

### Step 3: Clone the Repository

1. **Open PowerShell or Command Prompt**

2. **Navigate to your desired directory**
   ```powershell
   cd C:\Projects
   ```
   (Create the folder first if it doesn't exist: `mkdir C:\Projects`)

3. **Clone the repository**
   ```powershell
   git clone https://github.com/TataOwO/RT-MART.git
   ```

4. **Navigate into the project folder**
   ```powershell
   cd RT-MART
   ```

### Step 4: Build and Run the Application

1. **Make sure Docker Desktop is running**
   - Check that the Docker whale icon is visible in your system tray
   - The icon should be steady (not animating)

2. **Build and start all services**
   ```powershell
   docker-compose up -d --build
   ```

   This command will:
   - Download the required Docker images (MariaDB, Node.js)
   - Build the frontend and backend containers
   - Start all three services (database, backend, frontend)

   **Note:** The first build may take 5-10 minutes depending on your internet speed.

3. **Check the status of containers**
   ```powershell
   docker-compose ps
   ```

   You should see three containers running:
   - `rt_mart_mariadb` - Database
   - `rt_mart_backend` - NestJS API server
   - `rt_mart_frontend` - React development server

4. **View logs (optional)**
   ```powershell
   # View all logs
   docker-compose logs -f

   # View only backend logs
   docker-compose logs -f backend

   # Press Ctrl+C to stop viewing logs
   ```

### Step 5: Access the Application

Once all containers are running:

| Service  | URL                         | Description            |
|----------|-----------------------------|-----------------------|
| Frontend | http://localhost:5173       | React web application |
| Backend  | http://localhost:3000       | NestJS API server     |
| API Health | http://localhost:3000/api/health | Health check endpoint |

Open your web browser and go to **http://localhost:5173** to see the application.

### Step 6: Stopping the Application

To stop all services:
```powershell
docker-compose down
```

To stop and remove all data (including database):
```powershell
docker-compose down -v
```

---

## Common Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services in background |
| `docker-compose up -d --build` | Rebuild and start all services |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop all services and remove volumes |
| `docker-compose logs -f` | View logs from all services |
| `docker-compose logs -f backend` | View backend logs only |
| `docker-compose ps` | Show status of all containers |
| `docker-compose restart backend` | Restart a specific service |

---

## Troubleshooting

### Docker Desktop won't start
- Ensure WSL2 is installed: Open PowerShell as Administrator and run:
  ```powershell
  wsl --install
  ```
- Restart your computer after installing WSL2

### "Port already in use" error
- Another application is using port 3000, 3306, or 5173
- Find and stop the conflicting application, or modify the ports in `docker-compose.yml`

### Containers keep restarting
- Check the logs for errors:
  ```powershell
  docker-compose logs backend
  ```
- Common causes: database connection issues, missing environment variables

### Frontend not loading
- Wait a few minutes after starting - the frontend needs time to compile
- Check frontend logs: `docker-compose logs -f frontend`
- Try hard refresh: `Ctrl + Shift + R` in your browser

### Database connection errors
- Ensure the MariaDB container is healthy:
  ```powershell
  docker-compose ps
  ```
- The backend waits for the database to be ready, but sometimes needs a restart:
  ```powershell
  docker-compose restart backend
  ```

### Changes not reflecting
- Frontend and backend support hot-reload
- If changes don't appear, try:
  ```powershell
  docker-compose restart
  ```

### "Permission denied" errors
- Run PowerShell as Administrator
- Or ensure your user has Docker permissions

### Low performance / slow startup
- Increase Docker Desktop resources:
  1. Right-click Docker icon in system tray → Settings
  2. Go to Resources → Advanced
  3. Increase Memory to at least 4GB
  4. Apply & Restart

---

## Project Structure

```
RT-MART/
├── frontend/          # React + Vite frontend application
├── backend/           # NestJS backend application
├── references/        # Database schema and diagrams
└── docker-compose.yml # Docker orchestration file
```

---

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, SCSS
- **Backend:** NestJS, TypeORM, TypeScript
- **Database:** MariaDB 11.2
- **Containerization:** Docker, Docker Compose
