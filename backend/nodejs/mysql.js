/**
 * MySQL Database Operations
 * Connection pool and query execution
 */

const mysql = require('mysql2/promise');

// MySQL connection pool
let pool = null;

/**
 * Get or create MySQL connection pool
 * @returns {mysql.Pool}
 */
function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || 'enma',
            port: parseInt(process.env.MYSQL_PORT || '3306'),
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0,
        });
    }
    return pool;
}

/**
 * Test MySQL connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const pool = getPool();
        const connection = await pool.getConnection();
        connection.release();
        return true;
    } catch (error) {
        console.error('MySQL connection test failed:', error.message);
        return false;
    }
}

/**
 * Execute SQL query
 * @param {string} sql - SQL query to execute
 * @param {string} database - Target database name
 * @returns {Promise<{success: boolean, rows: Array, columns: Array, rowCount: number, executionTime: number}>}
 */
async function executeQuery(sql, database = 'mysql') {
    const startTime = Date.now();
    const pool = getPool();

    let connection;
    try {
        connection = await pool.getConnection();

        // Use specified database
        if (database) {
            await connection.query(`USE \`${database}\``);
        }

        const [rows, fields] = await connection.query(sql);
        const executionTime = Date.now() - startTime;

        // Check if it's a SELECT-type query
        if (Array.isArray(rows)) {
            const columns = fields ? fields.map(f => f.name) : [];
            return {
                success: true,
                rows,
                columns,
                rowCount: rows.length,
                executionTime,
            };
        } else {
            // For INSERT, UPDATE, DELETE, etc.
            return {
                success: true,
                rows: [],
                columns: [],
                rowCount: rows.affectedRows || 0,
                message: `${rows.affectedRows || 0} row(s) affected`,
                executionTime,
            };
        }
    } catch (error) {
        console.error('MySQL query error:', error);
        return {
            success: false,
            error: error.message,
            rows: [],
            columns: [],
            rowCount: 0,
            executionTime: Date.now() - startTime,
        };
    } finally {
        if (connection) connection.release();
    }
}

/**
 * List all databases
 * @returns {Promise<string[]>}
 */
async function listDatabases() {
    const pool = getPool();
    const [rows] = await pool.query('SHOW DATABASES');
    return rows.map(row => row.Database);
}

/**
 * Get database schema (tables and columns)
 * @param {string} database - Database name
 * @returns {Promise<{database: string, tables: string[], schema: object}>}
 */
async function getSchema(database) {
    const pool = getPool();
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.query(`USE \`${database}\``);

        // Get all tables
        const [tablesResult] = await connection.query('SHOW TABLES');
        const tableKey = `Tables_in_${database}`;
        const tables = tablesResult.map(row => row[tableKey] || Object.values(row)[0]);

        // Get schema for each table
        const schema = {};
        for (const table of tables) {
            const [columns] = await connection.query(`DESCRIBE \`${table}\``);
            schema[table] = columns;
        }

        return { database, tables, schema };
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Get schema as CREATE TABLE context string
 * @param {string} database - Database name
 * @returns {Promise<string>}
 */
async function getSchemaContext(database) {
    try {
        const { schema } = await getSchema(database);
        const statements = [];

        for (const [table, columns] of Object.entries(schema)) {
            const columnDefs = columns.map(col => {
                let def = `${col.Field} ${col.Type}`;
                if (col.Null === 'NO') def += ' NOT NULL';
                if (col.Key === 'PRI') def += ' PRIMARY KEY';
                return def;
            }).join(', ');
            statements.push(`CREATE TABLE ${table} (${columnDefs});`);
        }

        return statements.join(' ');
    } catch (error) {
        console.error('Error getting schema context:', error);
        return '';
    }
}

module.exports = {
    getPool,
    testConnection,
    executeQuery,
    listDatabases,
    getSchema,
    getSchemaContext,
};
