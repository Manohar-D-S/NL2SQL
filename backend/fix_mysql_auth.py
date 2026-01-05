"""
Quick MySQL Authentication Fix
This script attempts to fix the MySQL authentication issue
Run with: python fix_mysql_auth.py
"""

import mysql.connector
from mysql.connector import Error
import getpass

print("\n" + "="*70)
print("🔧 MySQL Authentication Fix Utility")
print("="*70 + "\n")

# Get credentials
print("Enter your MySQL credentials (for user with GRANT privileges):")
admin_user = input("Username (default: root): ").strip() or "root"
admin_password = getpass.getpass("Password: ")

# User to fix
fix_user = input("\nWhich user to fix? (default: root): ").strip() or "root"
new_password = getpass.getpass(f"New password for {fix_user}: ")

try:
    print("\n🔌 Connecting to MySQL...")
    
    # Try different authentication methods
    connection = None
    errors = []
    
    # Try 1: With cryptography support
    try:
        connection = mysql.connector.connect(
            host='localhost',
            user=admin_user,
            password=admin_password,
            port=3306
        )
        print("✅ Connected using default authentication")
    except Error as e:
        errors.append(f"Default: {str(e)}")
    
    # Try 2: With native password
    if not connection:
        try:
            connection = mysql.connector.connect(
                host='localhost',
                user=admin_user,
                password=admin_password,
                port=3306,
                auth_plugin='mysql_native_password'
            )
            print("✅ Connected using mysql_native_password")
        except Error as e:
            errors.append(f"Native password: {str(e)}")
    
    if not connection:
        print("\n❌ Failed to connect with both methods:")
        for err in errors:
            print(f"   - {err}")
        print("\n💡 Try installing cryptography:")
        print("   pip install cryptography")
        exit(1)
    
    cursor = connection.cursor()
    
    # Fix the user authentication
    print(f"\n🔧 Changing authentication for user '{fix_user}'...")
    
    queries = [
        f"ALTER USER '{fix_user}'@'localhost' IDENTIFIED WITH mysql_native_password BY '{new_password}';",
        "FLUSH PRIVILEGES;"
    ]
    
    for query in queries:
        cursor.execute(query)
        print(f"✅ Executed: {query.split()[0]} {query.split()[1]}")
    
    # Verify the change
    print("\n🔍 Verifying authentication plugin...")
    cursor.execute(f"SELECT user, host, plugin FROM mysql.user WHERE user = '{fix_user}';")
    result = cursor.fetchone()
    
    if result:
        user, host, plugin = result
        print(f"✅ User: {user}@{host}")
        print(f"✅ Plugin: {plugin}")
        
        if plugin == 'mysql_native_password':
            print(f"\n🎉 Success! User '{fix_user}' is now using mysql_native_password")
            print("\n📋 Next steps:")
            print(f"   1. Update local_sql_server.py with:")
            print(f"      MYSQL_CONFIG = {{")
            print(f"          'user': '{fix_user}',")
            print(f"          'password': '{new_password}',")
            print(f"          ...")
            print(f"      }}")
            print(f"   2. Restart the SQL server: python local_sql_server.py")
        else:
            print(f"\n⚠️  Warning: Plugin is still '{plugin}'")
            print("   The ALTER USER command may not have worked")
    
    cursor.close()
    connection.close()
    
except Error as e:
    print(f"\n❌ MySQL Error: {str(e)}")
    print("\n💡 Suggestions:")
    print("   1. Make sure MySQL is running")
    print("   2. Check your credentials")
    print("   3. Try installing: pip install cryptography")
except Exception as e:
    print(f"\n❌ Unexpected error: {str(e)}")

print("\n" + "="*70 + "\n")
