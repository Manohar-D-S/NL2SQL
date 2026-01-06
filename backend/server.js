/**
 * NL-to-SQL Backend Server
 * Uses Cerebras AI (Qwen 3 235B) for natural language to SQL translation
 * Handles MySQL and MongoDB database operations
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');

// Import route handlers
const translateRoutes = require('./routes/translate');
const databaseRoutes = require('./routes/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Mount routes
app.use('/api', translateRoutes);
app.use('/api', databaseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: err.message || 'Internal server error',
        success: false,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: `Endpoint ${req.method} ${req.path} not found`,
        success: false,
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 NL-to-SQL Backend Server (Node.js + Cerebras)');
    console.log('='.repeat(70));
    console.log(`\n📡 Server running on: http://localhost:${PORT}`);
    console.log('\n🔗 Endpoints:');
    console.log('   - GET  /api/health          - Health check');
    console.log('   - POST /api/translate       - NL to SQL translation (Cerebras)');
    console.log('   - POST /api/explain         - SQL explanation');
    console.log('   - POST /api/optimize        - Query optimization');
    console.log('   - POST /api/validate        - SQL safety validation');
    console.log('   - GET  /api/databases       - List databases');
    console.log('   - POST /api/execute         - Execute SQL');
    console.log('   - GET  /api/schema/:db      - Get database schema');
    console.log('\n⚠️  Make sure MySQL & MongoDB is running!');
    console.log('='.repeat(70) + '\n');
});
