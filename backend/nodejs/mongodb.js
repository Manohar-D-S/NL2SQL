/**
 * MongoDB Database Operations
 * Connection and query execution for NoSQL
 */

const { MongoClient } = require('mongodb');

// MongoDB client singleton
let client = null;
let db = null;

/**
 * Get MongoDB client
 * @returns {Promise<MongoClient>}
 */
async function getClient() {
    if (!client) {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
        client = new MongoClient(uri);
        await client.connect();
        console.log('✅ MongoDB connected');
    }
    return client;
}

/**
 * Get database instance
 * @param {string} dbName - Database name
 * @returns {Promise<Db>}
 */
async function getDb(dbName = 'test') {
    const client = await getClient();
    return client.db(dbName);
}

/**
 * Test MongoDB connection
 * @returns {Promise<boolean>}
 */
async function testConnection() {
    try {
        const client = await getClient();
        await client.db('admin').command({ ping: 1 });
        return true;
    } catch (error) {
        console.error('MongoDB connection test failed:', error.message);
        return false;
    }
}

/**
 * List all databases
 * @returns {Promise<string[]>}
 */
async function listDatabases() {
    const client = await getClient();
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    return result.databases.map(db => db.name);
}

/**
 * List collections in a database
 * @param {string} dbName - Database name
 * @returns {Promise<string[]>}
 */
async function listCollections(dbName) {
    const db = await getDb(dbName);
    const collections = await db.listCollections().toArray();
    return collections.map(c => c.name);
}

/**
 * Get collection schema (sample document structure)
 * @param {string} dbName - Database name
 * @param {string} collectionName - Collection name
 * @returns {Promise<object>}
 */
async function getCollectionSchema(dbName, collectionName) {
    const db = await getDb(dbName);
    const collection = db.collection(collectionName);

    // Get a sample document to infer schema
    const sample = await collection.findOne({});
    if (!sample) return { fields: [] };

    const fields = Object.keys(sample).map(key => ({
        name: key,
        type: typeof sample[key],
        sample: JSON.stringify(sample[key]).substring(0, 50),
    }));

    return { fields, documentCount: await collection.countDocuments() };
}

/**
 * Execute MongoDB query/aggregation
 * @param {string} dbName - Database name
 * @param {string} collectionName - Collection name
 * @param {string} operation - Operation type (find, aggregate, etc.)
 * @param {object} query - Query object
 * @param {object} options - Query options
 * @returns {Promise<{success: boolean, rows: Array, rowCount: number}>}
 */
async function executeQuery(dbName, collectionName, operation, query = {}, options = {}) {
    const startTime = Date.now();

    try {
        const db = await getDb(dbName);
        const collection = db.collection(collectionName);

        let result;
        switch (operation.toLowerCase()) {
            case 'find':
                result = await collection.find(query, options).limit(options.limit || 100).toArray();
                break;
            case 'findone':
                result = await collection.findOne(query);
                result = result ? [result] : [];
                break;
            case 'aggregate':
                result = await collection.aggregate(query).toArray();
                break;
            case 'count':
                const count = await collection.countDocuments(query);
                result = [{ count }];
                break;
            case 'distinct':
                result = await collection.distinct(options.field || '_id', query);
                result = result.map(v => ({ value: v }));
                break;
            default:
                throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
            success: true,
            rows: result,
            rowCount: result.length,
            executionTime: Date.now() - startTime,
        };
    } catch (error) {
        console.error('MongoDB query error:', error);
        return {
            success: false,
            error: error.message,
            rows: [],
            rowCount: 0,
            executionTime: Date.now() - startTime,
        };
    }
}

/**
 * Close MongoDB connection
 */
async function close() {
    if (client) {
        await client.close();
        client = null;
        console.log('MongoDB connection closed');
    }
}

module.exports = {
    getClient,
    getDb,
    testConnection,
    listDatabases,
    listCollections,
    getCollectionSchema,
    executeQuery,
    close,
};
