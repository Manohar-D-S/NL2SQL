# 🚀 Setup Local MySQL Execution Server

## What This Does

- **Colab Backend** (ngrok): Translates natural language → SQL using BART model ✅
- **Local Server** (localhost:5000): Executes SQL on your local MySQL database 🆕

---

## 📋 Step-by-Step Setup

### Step 1: Install Requirements

Open a NEW terminal and run:

```powershell
cd d:\dbms
pip install -r local-sql-requirements.txt
```

This installs:
- Flask (web server)
- Flask-CORS (for frontend communication)
- mysql-connector-python (MySQL driver)

---

### Step 2: Make Sure MySQL is Running

1. Open **MySQL Workbench** or **Services**
2. Verify MySQL service is running

Test connection:
```powershell
mysql -u root -penma
```

If it connects, you're good! Type `exit` to close.

---

### Step 3: Start the Local SQL Server

In the NEW terminal:

```powershell
python local_sql_server.py
```

You should see:

```
======================================================================
🚀 Local SQL Execution Server
======================================================================

📊 MySQL Configuration:
   Host: localhost
   User: root
   Port: 3306

📡 Server running on: http://localhost:5000

🔗 Endpoints:
   - GET  /api/health          - Health check
   - GET  /api/databases       - List databases
   - POST /api/execute         - Execute SQL
   - GET  /api/schema/<db>     - Get database schema

⚠️  Make sure MySQL is running!
======================================================================
```

**Keep this terminal running!**

---

### Step 4: Verify It's Working

Open a browser and go to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "healthy",
  "mysql_connected": true,
  "message": "Local SQL execution server is running"
}
```

---

## ✅ Now You're Ready!

### Complete Workflow:

1. **Frontend** (localhost:3000):
   - User types: "Show all students with marks above 80"
   
2. **Colab Backend** (ngrok):
   - Translates to SQL: `SELECT * FROM students WHERE marks > 80;`
   - Returns to frontend
   
3. **User clicks "Run"**

4. **Local SQL Server** (localhost:5000):
   - Executes SQL on your MySQL database
   - Returns results to frontend
   
5. **Frontend displays results** in a table 🎉

---

## 🧪 Test the Full Flow

### 1. Create a test database (optional)

```sql
CREATE DATABASE test_db;
USE test_db;

CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    marks INT,
    department VARCHAR(50)
);

INSERT INTO students (name, marks, department) VALUES
('Alice', 85, 'Computer Science'),
('Bob', 92, 'Mathematics'),
('Charlie', 78, 'Physics'),
('David', 95, 'Computer Science'),
('Eve', 88, 'Mathematics');
```

### 2. In the frontend

1. Type: `Show all students with marks above 80`
2. Click: **"Translate"**
3. Select the SQL candidate
4. Click: **"Run"**
5. See the results! 🎉

---

## 🐛 Troubleshooting

### "Connection refused" on port 5000

**Cause:** Local SQL server not running

**Solution:** Run `python local_sql_server.py` in a terminal

### "Access denied for user 'root'"

**Cause:** Wrong MySQL password

**Solution:** Open `local_sql_server.py` and update line 17:
```python
'password': 'enma',  # ← Change this to your actual password
```

### "Can't connect to MySQL server"

**Cause:** MySQL service not running

**Solution:** Start MySQL service:
- Windows: Services → MySQL → Start
- Or: Open MySQL Workbench

---

## 📊 Status Check

Check all services are running:

| Service | URL | Status |
|---------|-----|--------|
| Frontend | http://localhost:3000 | ✅ |
| Colab (Translation) | https://unpronouncing-kaylin...ngrok.io | ✅ |
| Local SQL | http://localhost:5000 | 🆕 Check! |
| MySQL | localhost:3306 | 🆕 Check! |

---

## 💡 Quick Commands

```powershell
# Terminal 1: Local SQL Server
python local_sql_server.py

# Terminal 2: Frontend (already running)
npm run dev

# Test local SQL server
curl http://localhost:5000/api/health

# Test MySQL connection
mysql -u root -penma
```

---

**Once all 3 services are running, you have a complete NL2SQL system!** 🚀

Ready to translate natural language to SQL and execute it on your database!
