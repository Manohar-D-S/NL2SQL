# MySQL Authentication Fix Guide

## Problem
Your MySQL server is running on port 5000 but can't connect due to:
```
Authentication plugin 'caching_sha2_password' is not supported
```

This is a MySQL 8.0 issue where the default authentication plugin changed.

## Solutions

### Solution 1: Change MySQL User Authentication (RECOMMENDED)

Run these SQL commands in your MySQL:

```sql
-- Connect to MySQL as root
mysql -u root -p

-- Change root user authentication to mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'enma';
FLUSH PRIVILEGES;

-- Verify the change
SELECT user, host, plugin FROM mysql.user WHERE user = 'root';

-- Exit MySQL
EXIT;
```

### Solution 2: Create New User with Correct Auth

```sql
-- Create a new user with native password auth
CREATE USER 'dbms_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';

-- Grant all privileges
GRANT ALL PRIVILEGES ON *.* TO 'dbms_user'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

Then update `local_sql_server.py`:
```python
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'dbms_user',  # Change this
    'password': 'your_password',  # Change this
    'port': 3306,
}
```

### Solution 3: Install Additional Python Package

If the above doesn't work, install the cryptography package:

```powershell
pip install cryptography
```

This allows Python to support caching_sha2_password.

## Steps to Fix

### Step 1: Stop the SQL Server

In the terminal running `local_sql_server.py`, press `Ctrl+C` to stop it.

### Step 2: Run MySQL Commands

Open MySQL Workbench or command line and run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'enma';
FLUSH PRIVILEGES;
```

### Step 3: Restart SQL Server

```powershell
python local_sql_server.py
```

### Step 4: Test the Connection

```powershell
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "mysql_connected": true,
  "message": "Local SQL execution server is running"
}
```

## Quick Test After Fix

### Test 1: Health Check
```powershell
curl http://localhost:5000/api/health
```

### Test 2: List Databases
```powershell
curl http://localhost:5000/api/databases
```

### Test 3: Execute Simple Query
```powershell
$body = @{
    sql = "SELECT 1 AS test"
    database = "mysql"
} | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri "http://localhost:5000/api/execute" -ContentType "application/json" -Body $body
```

## Alternative: Use MySQL Workbench

1. Open MySQL Workbench
2. Connect to your localhost server
3. Go to **Server** → **Users and Privileges**
4. Select `root` user
5. Click **Change Authentication**
6. Select **Standard** (mysql_native_password)
7. Enter password: `enma`
8. Click **Apply**

## Troubleshooting

### If you get "Access Denied"

```sql
-- Reset root password
ALTER USER 'root'@'localhost' IDENTIFIED BY 'enma';
FLUSH PRIVILEGES;
```

### If ALTER USER doesn't work

```sql
-- Drop and recreate user
DROP USER IF EXISTS 'root'@'localhost';
CREATE USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'enma';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
```

### If nothing works

Install the cryptography package which adds support for the new auth:

```powershell
pip install cryptography
```

Then you don't need to change MySQL authentication.

---

## What I've Already Done

✅ Updated `local_sql_server.py` to include `auth_plugin='mysql_native_password'`

## What You Need to Do

1. **Run the ALTER USER command in MySQL**
2. **Restart the SQL server**
3. **Test the connection**

Let me know once you've run the MySQL commands and I'll help test!
