/**
 * Database Routes
 * Endpoints for database operations (health, execute, schema, etc.)
 */

const express = require('express');
const router = express.Router();
const mysqlDb = require('../mysql');
const mongoDb = require('../mongodb');
const cerebras = require('../cerebras');

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
    try {
        const mysqlConnected = await mysqlDb.testConnection();
        let mongoConnected = false;

        try {
            mongoConnected = await mongoDb.testConnection();
        } catch (e) {
            // MongoDB is optional
        }

        const status = mysqlConnected ? 'healthy' : 'degraded';

        res.json({
            status,
            mysql_connected: mysqlConnected,
            mongo_connected: mongoConnected,
            cerebras_available: cerebras.isAvailable(),
            cerebras_model: cerebras.MODEL,
            message: 'NL-to-SQL Backend (Node.js + Cerebras)',
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            mysql_connected: false,
            mongo_connected: false,
            cerebras_available: cerebras.isAvailable(),
            error: error.message,
        });
    }
});

/**
 * GET /api/databases
 * List all available databases
 */
router.get('/databases', async (req, res, next) => {
    try {
        const databases = await mysqlDb.listDatabases();
        res.json({ databases });
    } catch (error) {
        console.error('[databases] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/execute
 * Execute SQL query on MySQL
 */
router.post('/execute', async (req, res, next) => {
    try {
        const { sql, database = 'mysql' } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'SQL query is required' });
        }

        console.log(`[execute] Database: ${database}, SQL: ${sql.substring(0, 100)}...`);

        const result = await mysqlDb.executeQuery(sql, database);

        if (!result.success) {
            return res.status(400).json(result);
        }

        console.log(`[execute] Success, ${result.rowCount} rows`);
        res.json(result);
    } catch (error) {
        console.error('[execute] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            rows: [],
            columns: [],
        });
    }
});

/**
 * GET /api/schema/:database
 * Get database schema
 */
router.get('/schema/:database', async (req, res, next) => {
    try {
        const { database } = req.params;

        console.log(`[schema] Fetching schema for: ${database}`);
        const result = await mysqlDb.getSchema(database);

        res.json(result);
    } catch (error) {
        console.error('[schema] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/feedback
 * Log user feedback (placeholder for now)
 */
router.post('/feedback', async (req, res) => {
    const { queryId, feedback, comment } = req.body;
    console.log(`[feedback] Query: ${queryId}, Feedback: ${feedback}, Comment: ${comment || 'N/A'}`);
    res.json({ success: true, message: 'Feedback recorded' });
});

/**
 * GET /api/history
 * Get query history (placeholder)
 */
router.get('/history', async (req, res) => {
    // TODO: Implement actual history storage
    res.json([]);
});

/**
 * GET /api/analytics
 * Get analytics data (placeholder)
 */
router.get('/analytics', async (req, res) => {
    // TODO: Implement actual analytics
    res.json({
        totalQueries: 0,
        averageLatency: 0,
        acceptanceRate: 0,
        queryFrequency: [],
        latencyTrend: [],
    });
});

// ============ MongoDB Routes ============

/**
 * GET /api/mongo/databases
 * List MongoDB databases
 */
router.get('/mongo/databases', async (req, res, next) => {
    try {
        const databases = await mongoDb.listDatabases();
        res.json({ databases });
    } catch (error) {
        console.error('[mongo/databases] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/mongo/collections/:database
 * List collections in a MongoDB database
 */
router.get('/mongo/collections/:database', async (req, res, next) => {
    try {
        const { database } = req.params;
        const collections = await mongoDb.listCollections(database);
        res.json({ database, collections });
    } catch (error) {
        console.error('[mongo/collections] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/mongo/execute
 * Execute MongoDB query
 */
router.post('/mongo/execute', async (req, res, next) => {
    try {
        const { database, collection, operation = 'find', query = {}, options = {} } = req.body;

        if (!database || !collection) {
            return res.status(400).json({ error: 'database and collection are required' });
        }

        console.log(`[mongo/execute] ${database}.${collection}.${operation}`);
        const result = await mongoDb.executeQuery(database, collection, operation, query, options);

        res.json(result);
    } catch (error) {
        console.error('[mongo/execute] Error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            rows: [],
        });
    }
});

module.exports = router;
