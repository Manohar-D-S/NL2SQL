"""
Local SQL Execution Server
This server executes SQL queries on your local MySQL database
Run with: python local_sql_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'enma',
    'port': 3306,
}


def get_mysql_connection(database='mysql'):
    """Create MySQL connection"""
    try:
        connection = mysql.connector.connect(
            host=MYSQL_CONFIG['host'],
            user=MYSQL_CONFIG['user'],
            password=MYSQL_CONFIG['password'],
            database=database,
            port=MYSQL_CONFIG['port']
        )
        return connection
    except Error as e:
        logger.error(f"MySQL connection error: {e}")
        raise


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        # Test MySQL connection
        conn = get_mysql_connection()
        conn.close()
        return jsonify({
            'status': 'healthy',
            'mysql_connected': True,
            'message': 'Local SQL execution server is running'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'mysql_connected': False,
            'error': str(e)
        }), 503


@app.route('/api/databases', methods=['GET'])
def list_databases():
    """List all available databases"""
    try:
        conn = get_mysql_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW DATABASES")
        databases = [db[0] for db in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        return jsonify({
            'databases': databases
        })
    except Exception as e:
        logger.error(f"Error listing databases: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/execute', methods=['POST'])
def execute_sql():
    """Execute SQL query on MySQL"""
    try:
        data = request.get_json()
        sql = data.get('sql', '').strip()
        database = data.get('database', 'mysql')
        
        if not sql:
            return jsonify({'error': 'SQL query is required'}), 400
        
        logger.info(f"Executing SQL on database '{database}': {sql[:100]}...")
        
        # Connect to MySQL
        conn = get_mysql_connection(database)
        cursor = conn.cursor(dictionary=True)
        
        # Execute query
        cursor.execute(sql)
        
        # Check if it's a SELECT query
        if sql.strip().upper().startswith('SELECT') or sql.strip().upper().startswith('SHOW') or sql.strip().upper().startswith('DESCRIBE'):
            # Fetch results
            rows = cursor.fetchall()
            columns = [desc[0] for desc in cursor.description] if cursor.description else []
            
            result = {
                'success': True,
                'rows': rows,
                'columns': columns,
                'rowCount': len(rows),
                'executionTime': 0,  # Can add timing if needed
            }
        else:
            # For INSERT, UPDATE, DELETE, etc.
            conn.commit()
            result = {
                'success': True,
                'rows': [],
                'columns': [],
                'rowCount': cursor.rowcount,
                'message': f'{cursor.rowcount} row(s) affected',
                'executionTime': 0,
            }
        
        cursor.close()
        conn.close()
        
        logger.info(f"Query executed successfully. Rows: {result['rowCount']}")
        return jsonify(result)
        
    except Error as e:
        logger.error(f"MySQL error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'rows': [],
            'columns': [],
        }), 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'rows': [],
            'columns': [],
        }), 500


@app.route('/api/schema/<database>', methods=['GET'])
def get_schema(database):
    """Get database schema"""
    try:
        conn = get_mysql_connection(database)
        cursor = conn.cursor(dictionary=True)
        
        # Get all tables
        cursor.execute("SHOW TABLES")
        tables = [list(table.values())[0] for table in cursor.fetchall()]
        
        schema = {}
        for table in tables:
            # Get columns for each table
            cursor.execute(f"DESCRIBE {table}")
            columns = cursor.fetchall()
            schema[table] = columns
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'database': database,
            'tables': tables,
            'schema': schema
        })
    except Exception as e:
        logger.error(f"Error fetching schema: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 Local SQL Execution Server")
    print("="*70)
    print(f"\n📊 MySQL Configuration:")
    print(f"   Host: {MYSQL_CONFIG['host']}")
    print(f"   User: {MYSQL_CONFIG['user']}")
    print(f"   Port: {MYSQL_CONFIG['port']}")
    print("\n📡 Server running on: http://localhost:5000")
    print("\n🔗 Endpoints:")
    print("   - GET  /api/health          - Health check")
    print("   - GET  /api/databases       - List databases")
    print("   - POST /api/execute         - Execute SQL")
    print("   - GET  /api/schema/<db>     - Get database schema")
    print("\n⚠️  Make sure MySQL is running!")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=True)
