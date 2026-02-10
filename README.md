# NL2SQL - Natural Language to SQL & MongoDB Translator

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![React](https://img.shields.io/badge/React-19.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-cyan)

A powerful, modern web application that translates natural language into executable SQL and MongoDB queries using AI. Built with Next.js 16, React 19, and the Cerebras Inference Cloud.

## 🌟 Key Features

### 🧠 Intelligent Translation
- **Natural Language Processing**: Convert plain English instructions into complex SQL or MongoDB queries.
- **Multi-Database Support**: Seamlessly switch between **MySQL** (Relational) and **MongoDB** (NoSQL).
- **Context-Aware**: Uses your database schema to generate accurate table and column names.
- **AI Backend**: Powered by **Llama 3.3-70b** via Cerebras for lightning-fast inference.

### 🛡️ Safety & Reliability
- **Query Validation**: Automatically detects and warns about destructive operations (DROP, DELETE, TRUNCATE).
- **SQL Injection Guard**: Identifies potential injection patterns before execution.
- **Auto-Debugging**: When a query fails, the AI analyzes the error and suggests a fix automatically.

### 💻 Modern Developer Experience
- **Three-Panel Interface**:
  1. **Input**: Natural language query and AI explanations.
  2. **Results**: Real-time execution results and performance metrics.
  3. **Editor**: Full-featured SQL/JSON editor for manual tweaking.
- **Detailed Explanations**: Get human-readable breakdowns of what every part of a query does.
- **Optimization Tips**: Receive AI suggestions to improve query performance (indexes, rewriting).

---

## 🏗️ Architecture

The application follows a clean client-server architecture:

```mermaid
graph TD
    Client[Next.js Frontend\n(Port 3000)] -->|HTTP/REST| Server[Node.js Express API\n(Port 5000)]
    Server -->|Generate| AI[Cerebras AI Cloud\n(Llama 3.3)]
    Server -->|Execute SQL| MySQL[(MySQL Database)]
    Server -->|Execute NoSQL| Mongo[(MongoDB Database)]
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MySQL** (Local or Remote)
- **MongoDB** (Local or Atlas)
- **Cerebras API Key** (Get one at [cloud.cerebras.ai](https://cloud.cerebras.ai))

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manohar-D-S/NL2SQL.git
   cd NL2SQL
   ```

2. **Install dependencies:**
   ```bash
   # Install frontend dependencies
   npm install

   # Install backend dependencies
   cd backend
   npm install
   cd ..
   ```

3. **Configure Environment:**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```env
   # API Keys
   CEREBRAS_API_KEY=your_key_here

   # Database Config
   MONGODB_URI=mongodb+srv://...
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=password
   ```

4. **Run the Application:**
   ```bash
   # Start Client and Server concurrently
   npm start
   ```
   
   Or run them separately:
   ```bash
   # Terminal 1: Backend
   npm run dev:backend

   # Terminal 2: Frontend
   npm run dev:frontend
   ```

   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:5000](http://localhost:5000)

---

## 🐳 Docker Support

Run the entire stack (Frontend + Backend + MySQL) with one command.

```bash
docker-compose up --build
```
*Note: MySQL will be available on port **3307** to avoid conflicts with local instances.*

---

## 🛠 Project Structure

```
NL2SQL/
├── app/                  # Next.js 16 App Router
│   ├── page.tsx          # Main Workspace UI
│   └── layout.tsx        # Root Layout
├── backend/              # Express Server
│   ├── server.js         # API Entry Point
│   ├── cerebras.js       # AI Logic (Llama 3.3)
│   ├── mysql.js          # MySQL Connector
│   └── mongodb.js        # MongoDB Connector
├── components/           # React 19 Components
│   ├── ui/               # Shadcn UI primitives
│   ├── nl-input-bar.tsx  # Input component
│   └── sql-editor.tsx    # Code editor
└── public/               # Static assets
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
