/**
 * Translation Routes
 * Endpoints for NL-to-SQL translation and SQL analysis
 */

const express = require('express');
const router = express.Router();
const cerebras = require('../cerebras');
const mysqlDb = require('../mysql');
const mongoDb = require('../mongodb');

/**
 * POST /api/translate
 * Translate natural language to SQL
 */
router.post('/translate', async (req, res, next) => {
    try {
        const { natural_language, database = 'mysql', schema_context } = req.body;

        if (!natural_language) {
            return res.status(400).json({ error: 'natural_language is required' });
        }

        if (!cerebras.isAvailable()) {
            return res.status(503).json({
                error: 'Cerebras API key not configured. Set CEREBRAS_API_KEY in environment.',
                sql: null,
            });
        }

        console.log(`[translate] Query: "${natural_language.substring(0, 50)}...", Database: ${database}`);

        // Check if MongoDB mode
        const isMongoDB = database === 'mongodb';

        // Get schema context if not provided
        let schemaCtx = schema_context || '';
        if (!schemaCtx) {
            try {
                if (isMongoDB) {
                    // For MongoDB, get the default database schema
                    const mongoDbName = process.env.MONGODB_DATABASE || 'sample_mflix';
                    schemaCtx = await mongoDb.getSchemaContext(mongoDbName);
                    console.log(`[translate] Fetched MongoDB schema context for ${mongoDbName}`);
                } else {
                    schemaCtx = await mysqlDb.getSchemaContext(database);
                    console.log(`[translate] Fetched MySQL schema context for ${database}`);
                }
            } catch (e) {
                console.warn('[translate] Could not fetch schema context:', e.message);
            }
        }

        // Translate using Cerebras
        let result;
        if (isMongoDB) {
            result = await cerebras.translateToMongoDB(natural_language, schemaCtx);
            console.log(`[translate] Generated MongoDB query: ${result.sql?.substring(0, 100)}`);
        } else {
            result = await cerebras.translateToSQL(natural_language, schemaCtx);
            console.log(`[translate] Generated SQL: ${result.sql?.substring(0, 100)}`);
        }

        res.json(result);
    } catch (error) {
        console.error('[translate] Error:', error);
        res.status(500).json({ error: error.message, sql: null });
    }
});

/**
 * POST /api/explain
 * Explain SQL query in natural language
 */
router.post('/explain', async (req, res, next) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'sql is required' });
        }

        if (!cerebras.isAvailable()) {
            return res.json({
                explanation: 'SQL explanation feature requires Cerebras API key.',
                clauses: {},
            });
        }

        console.log(`[explain] SQL: ${sql.substring(0, 50)}...`);
        const result = await cerebras.explainSQL(sql);
        res.json(result);
    } catch (error) {
        console.error('[explain] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/optimize
 * Get optimization suggestions for SQL query
 */
router.post('/optimize', async (req, res, next) => {
    try {
        const { sql, database = 'mysql' } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'sql is required' });
        }

        if (!cerebras.isAvailable()) {
            return res.json({
                suggestions: [
                    { type: 'other', suggestion: 'Optimization requires Cerebras API key.', speedup: 'N/A' },
                ],
            });
        }

        console.log(`[optimize] SQL: ${sql.substring(0, 50)}...`);
        const result = await cerebras.optimizeSQL(sql, database);
        res.json(result);
    } catch (error) {
        console.error('[optimize] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/validate
 * Validate SQL for safety
 */
router.post('/validate', async (req, res, next) => {
    try {
        const { sql } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'sql is required' });
        }

        console.log(`[validate] SQL: ${sql.substring(0, 50)}...`);
        const result = await cerebras.validateSQL(sql);
        res.json(result);
    } catch (error) {
        console.error('[validate] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/debug
 * Debug and fix a failed SQL query
 */
router.post('/debug', async (req, res, next) => {
    try {
        const { sql, error: errorMessage, database = 'sakila' } = req.body;

        if (!sql) {
            return res.status(400).json({ error: 'sql is required' });
        }

        if (!errorMessage) {
            return res.status(400).json({ error: 'error message is required' });
        }

        if (!cerebras.isAvailable()) {
            return res.status(503).json({
                error: 'Cerebras API key not configured. Set CEREBRAS_API_KEY in environment.',
                fixedSql: null,
            });
        }

        console.log(`[debug] Fixing query error: "${errorMessage.substring(0, 50)}...", Database: ${database}`);

        // Check if MongoDB mode
        const isMongoDB = database === 'mongodb';

        // Get schema context
        let schemaCtx = '';
        try {
            if (isMongoDB) {
                const mongoDbName = process.env.MONGODB_DATABASE || 'sample_mflix';
                schemaCtx = await mongoDb.getSchemaContext(mongoDbName);
                console.log(`[debug] Fetched MongoDB schema context for ${mongoDbName}`);
            } else {
                schemaCtx = await mysqlDb.getSchemaContext(database);
                console.log(`[debug] Fetched MySQL schema context for ${database}`);
            }
        } catch (e) {
            console.warn('[debug] Could not fetch schema context:', e.message);
        }

        // Debug using Cerebras
        let result;
        if (isMongoDB) {
            result = await cerebras.debugMongoDB(sql, errorMessage, schemaCtx);
            console.log(`[debug] Fixed MongoDB query: ${result.fixedSql?.substring(0, 100)}`);
        } else {
            result = await cerebras.debugSQL(sql, errorMessage, schemaCtx);
            console.log(`[debug] Fixed SQL: ${result.fixedSql?.substring(0, 100)}`);
        }

        res.json(result);
    } catch (error) {
        console.error('[debug] Error:', error);
        res.status(500).json({ error: error.message, fixedSql: null });
    }
});

module.exports = router;
