# NL2SQL - Natural Language to SQL Translator

A modern web application that translates natural language queries into executable SQL and MongoDB commands using an AI-powered backend system.

## 🌟 Overview

NL2SQL bridges the gap between human language and database queries. Simply describe what data you want in plain English, and the system converts it into valid SQL or MongoDB queries that you can execute directly against your databases.

### Key Features

- **Natural Language Translation** - Convert plain English to SQL/MongoDB queries
- **Multi-Database Support** - Works with both MySQL and MongoDB
- **Query Explanation** - Get human-readable explanations of SQL queries
- **Query Optimization** - AI-powered suggestions to improve query performance
- **Safety Validation** - Automatic detection of potentially dangerous queries
- **Query Debugging** - AI-assisted fixing of failed queries
- **Modern UI** - Clean, responsive interface built with Next.js

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│                 http://localhost:3000                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│              Backend NL2SQL Server (Node.js)            │
│                 http://localhost:5000                   │
│  • /api/translate - NL to SQL translation               │
│  • /api/explain   - Query explanation                   │
│  • /api/optimize  - Query optimization                  │
│  • /api/validate  - Safety validation                   │
│  • /api/execute   - Execute queries                     │
└───────────┬─────────────────────────────┬───────────────┘
            │                             │
            ▼                             ▼
    ┌───────────────┐             ┌───────────────┐
    │     MySQL     │             │    MongoDB    │
    │  (Port 3306)  │             │ (Port 27017)  │
    └───────────────┘             └───────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **yarn**
- **MySQL** (local or remote)
- **MongoDB** (local or MongoDB Atlas)

---

## 📦 Installation & Setup (Manual)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Manohar-D-S/NL2SQL.git
cd NL2SQL
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

### Step 3: Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory using the template:

```bash
cp .env.example .env
```

Edit `.env` and fill in your configuration:

```env
# NL2SQL Backend API Key (Required)
CEREBRAS_API_KEY=your_api_key_here

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DB_NAME=your_database
MONGODB_DATABASE=your_database
MONGODB_PSWD=your_password

# MySQL Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_PORT=3306

# Server Configuration
SQL_SERVER_PORT=5000
NOSQL_SERVER_PORT=5000
```

### Step 5: Start the Application

**Option A: Start both frontend and backend together**

```bash
npm start
```

**Option B: Start separately**

```bash
# Terminal 1 - Start the backend NL2SQL server
npm run dev:backend

# Terminal 2 - Start the frontend
npm run dev:frontend
```

### Step 6: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 🐳 Docker Setup

### Prerequisites

- **Docker** v20.10 or higher
- **Docker Compose** v2.0 or higher

### Step 1: Clone and Configure

```bash
git clone https://github.com/Manohar-D-S/NL2SQL.git
cd NL2SQL
cp .env.example .env
```

Edit the `.env` file with your configuration (see Step 4 above).

### Step 2: Build and Run with Docker Compose

```bash
docker-compose up --build
```

This will start:
- **Frontend** on port `3000`
- **Backend NL2SQL Server** on port `5000`
- **MySQL Database** on port `3307` (mapped from container's 3306)

### Step 3: Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

### Docker Commands

```bash
# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean reset)
docker-compose down -v

# Rebuild without cache
docker-compose build --no-cache
```

---

## 📁 Project Structure

```
NL2SQL/
├── app/                    # Next.js app directory
│   ├── page.tsx            # Main application page
│   └── layout.tsx          # Root layout
├── backend/                # Backend NL2SQL server
│   ├── server.js           # Express server entry point
│   ├── routes/             # API route handlers
│   ├── mysql.js            # MySQL connection handler
│   ├── mongodb.js          # MongoDB connection handler
│   └── Dockerfile          # Backend container config
├── components/             # React components
├── lib/                    # Utility functions
├── scripts/                # Database initialization scripts
├── docker-compose.yml      # Docker orchestration
├── Dockerfile              # Frontend container config
└── package.json            # Project dependencies
```

---

## 🔌 API Endpoints

| Method | Endpoint           | Description                    |
|--------|-------------------|--------------------------------|
| GET    | `/api/health`     | Health check                   |
| POST   | `/api/translate`  | Translate NL to SQL/MongoDB    |
| POST   | `/api/explain`    | Explain SQL query              |
| POST   | `/api/optimize`   | Get optimization suggestions   |
| POST   | `/api/validate`   | Validate query safety          |
| GET    | `/api/databases`  | List available databases       |
| POST   | `/api/execute`    | Execute SQL query              |
| GET    | `/api/schema/:db` | Get database schema            |

---

## 🛠️ Development

```bash
# Run frontend only
npm run dev:frontend

# Run backend only
npm run dev:backend

# Run both concurrently
npm run dev:all

# Build for production
npm run build

# Start production server
npm run start:prod
```

---

## ⚠️ Important Notes

1. **Database Connection**: Ensure your MySQL and MongoDB servers are running before starting the application.

2. **Environment Variables**: Never commit your `.env` file. Use `.env.example` as a template.

3. **Docker MySQL Port**: When using Docker, MySQL is exposed on port `3307` to avoid conflicts with local MySQL installations.

4. **MongoDB Atlas**: If using MongoDB Atlas, make sure to whitelist your IP address in the Atlas dashboard.

---

## 📄 License

This project is licensed under the MIT License.
