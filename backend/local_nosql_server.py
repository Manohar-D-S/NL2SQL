"""
Local NoSQL (MongoDB) Execution Server
This server executes queries on your MongoDB Atlas cluster
Run with: python local_nosql_server.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from pymongo.errors import PyMongoError, ConnectionFailure
from bson import ObjectId, json_util
import json
import logging
import os
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('.env.local')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# MongoDB Configuration
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://manohardscs:M0ng0DB.@cluster0.qotpwns.mongodb.net/?appName=Cluster0')
MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'dbms_nosql')
NOSQL_SERVER_PORT = int(os.getenv('NOSQL_SERVER_PORT', 5001))

# Global MongoDB client
mongo_client = None
mongo_db = None


def get_mongo_client():
    """Get or create MongoDB client"""
    global mongo_client, mongo_db
    try:
        if mongo_client is None:
            logger.info("Connecting to MongoDB Atlas...")
            mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
            # Test connection
            mongo_client.admin.command('ping')
            mongo_db = mongo_client[MONGODB_DB_NAME]
            logger.info(f"Connected to MongoDB database: {MONGODB_DB_NAME}")
        return mongo_client, mongo_db
    except ConnectionFailure as e:
        logger.error(f"MongoDB connection failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise


def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    return json.loads(json_util.dumps(doc))


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        client, db = get_mongo_client()
        # Ping the database
        client.admin.command('ping')
        return jsonify({
            'status': 'healthy',
            'mongodb_connected': True,
            'database': MONGODB_DB_NAME,
            'message': 'Local NoSQL execution server is running'
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'mongodb_connected': False,
            'error': str(e)
        }), 503


@app.route('/api/collections', methods=['GET'])
def list_collections():
    """List all collections in the database"""
    try:
        client, db = get_mongo_client()
        collections = db.list_collection_names()
        
        # Get stats for each collection
        collection_stats = []
        for coll_name in collections:
            try:
                stats = db.command('collStats', coll_name)
                collection_stats.append({
                    'name': coll_name,
                    'count': stats.get('count', 0),
                    'size': stats.get('size', 0),
                    'avgObjSize': stats.get('avgObjSize', 0)
                })
            except:
                collection_stats.append({
                    'name': coll_name,
                    'count': 0,
                    'size': 0,
                    'avgObjSize': 0
                })
        
        return jsonify({
            'database': MONGODB_DB_NAME,
            'collections': collection_stats
        })
    except Exception as e:
        logger.error(f"Error listing collections: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/query', methods=['POST'])
def execute_query():
    """Execute MongoDB query"""
    try:
        data = request.get_json()
        collection_name = data.get('collection', '')
        operation = data.get('operation', 'find')  # find, insert, update, delete, aggregate
        query = data.get('query', {})
        options = data.get('options', {})
        
        if not collection_name:
            return jsonify({'error': 'Collection name is required'}), 400
        
        logger.info(f"Executing {operation} on collection '{collection_name}'")
        
        client, db = get_mongo_client()
        collection = db[collection_name]
        
        result = {}
        
        if operation == 'find':
            # Find documents
            limit = options.get('limit', 100)
            skip = options.get('skip', 0)
            sort = options.get('sort', None)
            projection = options.get('projection', None)
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            if sort:
                cursor = cursor.sort(sort)
            
            documents = list(cursor)
            count = collection.count_documents(query)
            
            result = {
                'success': True,
                'operation': 'find',
                'documents': serialize_mongo_doc(documents),
                'count': len(documents),
                'totalCount': count,
                'executionTime': 0
            }
            
        elif operation == 'insert':
            # Insert document(s)
            documents = data.get('documents', [])
            if not isinstance(documents, list):
                documents = [documents]
            
            insert_result = collection.insert_many(documents)
            result = {
                'success': True,
                'operation': 'insert',
                'insertedCount': len(insert_result.inserted_ids),
                'insertedIds': [str(id) for id in insert_result.inserted_ids],
                'message': f'{len(insert_result.inserted_ids)} document(s) inserted'
            }
            
        elif operation == 'update':
            # Update document(s)
            update_data = data.get('update', {})
            multi = options.get('multi', False)
            
            if multi:
                update_result = collection.update_many(query, update_data)
            else:
                update_result = collection.update_one(query, update_data)
            
            result = {
                'success': True,
                'operation': 'update',
                'matchedCount': update_result.matched_count,
                'modifiedCount': update_result.modified_count,
                'message': f'{update_result.modified_count} document(s) updated'
            }
            
        elif operation == 'delete':
            # Delete document(s)
            multi = options.get('multi', False)
            
            if multi:
                delete_result = collection.delete_many(query)
            else:
                delete_result = collection.delete_one(query)
            
            result = {
                'success': True,
                'operation': 'delete',
                'deletedCount': delete_result.deleted_count,
                'message': f'{delete_result.deleted_count} document(s) deleted'
            }
            
        elif operation == 'aggregate':
            # Aggregation pipeline
            pipeline = data.get('pipeline', [])
            documents = list(collection.aggregate(pipeline))
            
            result = {
                'success': True,
                'operation': 'aggregate',
                'documents': serialize_mongo_doc(documents),
                'count': len(documents),
                'executionTime': 0
            }
            
        else:
            return jsonify({'error': f'Unsupported operation: {operation}'}), 400
        
        logger.info(f"Query executed successfully")
        return jsonify(result)
        
    except PyMongoError as e:
        logger.error(f"MongoDB error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'documents': []
        }), 400
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'documents': []
        }), 500


@app.route('/api/schema/<collection_name>', methods=['GET'])
def get_collection_schema(collection_name):
    """Get collection schema by sampling documents"""
    try:
        client, db = get_mongo_client()
        collection = db[collection_name]
        
        # Sample some documents to infer schema
        sample_size = 100
        documents = list(collection.find().limit(sample_size))
        
        if not documents:
            return jsonify({
                'collection': collection_name,
                'count': 0,
                'schema': {},
                'sampleDocuments': []
            })
        
        # Infer schema from sampled documents
        schema = {}
        for doc in documents:
            for key, value in doc.items():
                if key not in schema:
                    schema[key] = {
                        'type': type(value).__name__,
                        'count': 0,
                        'examples': []
                    }
                schema[key]['count'] += 1
                if len(schema[key]['examples']) < 3:
                    schema[key]['examples'].append(serialize_mongo_doc(value))
        
        # Add percentage to each field
        for key in schema:
            schema[key]['percentage'] = (schema[key]['count'] / len(documents)) * 100
        
        return jsonify({
            'collection': collection_name,
            'count': collection.count_documents({}),
            'sampledCount': len(documents),
            'schema': schema,
            'sampleDocuments': serialize_mongo_doc(documents[:5])
        })
    except Exception as e:
        logger.error(f"Error fetching schema: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/create-collection', methods=['POST'])
def create_collection():
    """Create a new collection"""
    try:
        data = request.get_json()
        collection_name = data.get('name', '')
        
        if not collection_name:
            return jsonify({'error': 'Collection name is required'}), 400
        
        client, db = get_mongo_client()
        
        # Create collection
        db.create_collection(collection_name)
        
        return jsonify({
            'success': True,
            'message': f"Collection '{collection_name}' created successfully",
            'collection': collection_name
        })
    except Exception as e:
        logger.error(f"Error creating collection: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/drop-collection/<collection_name>', methods=['DELETE'])
def drop_collection(collection_name):
    """Drop a collection"""
    try:
        client, db = get_mongo_client()
        db.drop_collection(collection_name)
        
        return jsonify({
            'success': True,
            'message': f"Collection '{collection_name}' dropped successfully"
        })
    except Exception as e:
        logger.error(f"Error dropping collection: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 Local NoSQL (MongoDB) Execution Server")
    print("="*70)
    print(f"\n📊 MongoDB Configuration:")
    print(f"   Database: {MONGODB_DB_NAME}")
    print(f"   URI: {MONGODB_URI[:50]}...")
    print(f"\n📡 Server running on: http://localhost:{NOSQL_SERVER_PORT}")
    print("\n🔗 Endpoints:")
    print("   - GET    /api/health                    - Health check")
    print("   - GET    /api/collections               - List collections")
    print("   - POST   /api/query                     - Execute query")
    print("   - GET    /api/schema/<collection>       - Get collection schema")
    print("   - POST   /api/create-collection         - Create new collection")
    print("   - DELETE /api/drop-collection/<name>    - Drop collection")
    print("\n⚠️  Make sure to set MONGODB_URI in .env.local!")
    print("="*70 + "\n")
    
    app.run(host='0.0.0.0', port=NOSQL_SERVER_PORT, debug=True)
