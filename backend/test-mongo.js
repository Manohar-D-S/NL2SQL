const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

async function testConnection() {
    console.log('🧪 Testing MongoDB Connection...');
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        console.error('❌ MONGODB_URI is missing in .env');
        return;
    }

    // Mask password for display
    const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
    console.log(`🔌 URI: ${maskedUri}`);

    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    });

    try {
        console.log('⏳ Connecting...');
        await client.connect();
        console.log('✅ Connected successfully!');

        const adminDb = client.db('admin');
        const result = await adminDb.command({ ping: 1 });
        console.log('🏓 Ping result:', result);

        const dbs = await adminDb.admin().listDatabases();
        console.log('📂 Databases:', dbs.databases.map(d => d.name).join(', '));

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.reason) console.error('   Reason:', error.reason);
        if (error.code) console.error('   Code:', error.code);
    } finally {
        await client.close();
    }
}

testConnection();
