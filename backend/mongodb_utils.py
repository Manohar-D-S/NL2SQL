"""
MongoDB Utilities
Reusable functions for MongoDB operations
"""

from pymongo import MongoClient
from pymongo.errors import PyMongoError, ConnectionFailure
from bson import ObjectId, json_util
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class MongoDBClient:
    """MongoDB client wrapper with utility methods"""
    
    def __init__(self, uri: str, database_name: str):
        """
        Initialize MongoDB client
        
        Args:
            uri: MongoDB connection string
            database_name: Name of the database to use
        """
        self.uri = uri
        self.database_name = database_name
        self.client = None
        self.db = None
        
    def connect(self):
        """Establish connection to MongoDB"""
        try:
            logger.info("Connecting to MongoDB...")
            self.client = MongoClient(self.uri, serverSelectionTimeoutMS=5000)
            # Test connection
            self.client.admin.command('ping')
            self.db = self.client[self.database_name]
            logger.info(f"Connected to database: {self.database_name}")
            return True
        except ConnectionFailure as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during connection: {e}")
            return False
    
    def disconnect(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def is_connected(self) -> bool:
        """Check if connected to MongoDB"""
        try:
            if self.client:
                self.client.admin.command('ping')
                return True
        except:
            pass
        return False
    
    @staticmethod
    def serialize_document(doc: Any) -> Any:
        """Convert MongoDB document to JSON-serializable format"""
        return json.loads(json_util.dumps(doc))
    
    @staticmethod
    def parse_query(query_str: str) -> Dict:
        """
        Parse query string to MongoDB query object
        
        Args:
            query_str: JSON string representation of query
            
        Returns:
            MongoDB query object
        """
        try:
            return json.loads(query_str)
        except json.JSONDecodeError:
            logger.error(f"Invalid query JSON: {query_str}")
            return {}
    
    def list_collections(self) -> List[str]:
        """Get list of all collections in the database"""
        if not self.db:
            return []
        return self.db.list_collection_names()
    
    def collection_exists(self, collection_name: str) -> bool:
        """Check if a collection exists"""
        return collection_name in self.list_collections()
    
    def get_collection_stats(self, collection_name: str) -> Dict:
        """Get statistics for a collection"""
        try:
            stats = self.db.command('collStats', collection_name)
            return {
                'name': collection_name,
                'count': stats.get('count', 0),
                'size': stats.get('size', 0),
                'avgObjSize': stats.get('avgObjSize', 0),
                'storageSize': stats.get('storageSize', 0),
                'indexes': stats.get('nindexes', 0)
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {'name': collection_name, 'error': str(e)}
    
    def find(self, collection_name: str, query: Dict = None, 
             limit: int = 100, skip: int = 0, 
             sort: List = None, projection: Dict = None) -> Dict:
        """
        Find documents in a collection
        
        Args:
            collection_name: Name of the collection
            query: MongoDB query filter
            limit: Maximum number of documents to return
            skip: Number of documents to skip
            sort: Sort specification
            projection: Fields to include/exclude
            
        Returns:
            Dictionary with documents and metadata
        """
        try:
            collection = self.db[collection_name]
            query = query or {}
            
            cursor = collection.find(query, projection).skip(skip).limit(limit)
            if sort:
                cursor = cursor.sort(sort)
            
            documents = list(cursor)
            total_count = collection.count_documents(query)
            
            return {
                'success': True,
                'documents': self.serialize_document(documents),
                'count': len(documents),
                'totalCount': total_count,
                'hasMore': (skip + len(documents)) < total_count
            }
        except PyMongoError as e:
            logger.error(f"Error finding documents: {e}")
            return {'success': False, 'error': str(e), 'documents': []}
    
    def insert_one(self, collection_name: str, document: Dict) -> Dict:
        """Insert a single document"""
        try:
            collection = self.db[collection_name]
            result = collection.insert_one(document)
            return {
                'success': True,
                'insertedId': str(result.inserted_id),
                'message': 'Document inserted successfully'
            }
        except PyMongoError as e:
            logger.error(f"Error inserting document: {e}")
            return {'success': False, 'error': str(e)}
    
    def insert_many(self, collection_name: str, documents: List[Dict]) -> Dict:
        """Insert multiple documents"""
        try:
            collection = self.db[collection_name]
            result = collection.insert_many(documents)
            return {
                'success': True,
                'insertedCount': len(result.inserted_ids),
                'insertedIds': [str(id) for id in result.inserted_ids],
                'message': f'{len(result.inserted_ids)} documents inserted'
            }
        except PyMongoError as e:
            logger.error(f"Error inserting documents: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_one(self, collection_name: str, query: Dict, update: Dict) -> Dict:
        """Update a single document"""
        try:
            collection = self.db[collection_name]
            result = collection.update_one(query, update)
            return {
                'success': True,
                'matchedCount': result.matched_count,
                'modifiedCount': result.modified_count,
                'message': f'{result.modified_count} document(s) updated'
            }
        except PyMongoError as e:
            logger.error(f"Error updating document: {e}")
            return {'success': False, 'error': str(e)}
    
    def update_many(self, collection_name: str, query: Dict, update: Dict) -> Dict:
        """Update multiple documents"""
        try:
            collection = self.db[collection_name]
            result = collection.update_many(query, update)
            return {
                'success': True,
                'matchedCount': result.matched_count,
                'modifiedCount': result.modified_count,
                'message': f'{result.modified_count} document(s) updated'
            }
        except PyMongoError as e:
            logger.error(f"Error updating documents: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_one(self, collection_name: str, query: Dict) -> Dict:
        """Delete a single document"""
        try:
            collection = self.db[collection_name]
            result = collection.delete_one(query)
            return {
                'success': True,
                'deletedCount': result.deleted_count,
                'message': f'{result.deleted_count} document(s) deleted'
            }
        except PyMongoError as e:
            logger.error(f"Error deleting document: {e}")
            return {'success': False, 'error': str(e)}
    
    def delete_many(self, collection_name: str, query: Dict) -> Dict:
        """Delete multiple documents"""
        try:
            collection = self.db[collection_name]
            result = collection.delete_many(query)
            return {
                'success': True,
                'deletedCount': result.deleted_count,
                'message': f'{result.deleted_count} document(s) deleted'
            }
        except PyMongoError as e:
            logger.error(f"Error deleting documents: {e}")
            return {'success': False, 'error': str(e)}
    
    def aggregate(self, collection_name: str, pipeline: List[Dict]) -> Dict:
        """Execute aggregation pipeline"""
        try:
            collection = self.db[collection_name]
            documents = list(collection.aggregate(pipeline))
            return {
                'success': True,
                'documents': self.serialize_document(documents),
                'count': len(documents)
            }
        except PyMongoError as e:
            logger.error(f"Error executing aggregation: {e}")
            return {'success': False, 'error': str(e), 'documents': []}
    
    def create_collection(self, collection_name: str) -> Dict:
        """Create a new collection"""
        try:
            self.db.create_collection(collection_name)
            return {
                'success': True,
                'message': f"Collection '{collection_name}' created successfully"
            }
        except PyMongoError as e:
            logger.error(f"Error creating collection: {e}")
            return {'success': False, 'error': str(e)}
    
    def drop_collection(self, collection_name: str) -> Dict:
        """Drop a collection"""
        try:
            self.db.drop_collection(collection_name)
            return {
                'success': True,
                'message': f"Collection '{collection_name}' dropped successfully"
            }
        except PyMongoError as e:
            logger.error(f"Error dropping collection: {e}")
            return {'success': False, 'error': str(e)}
    
    def infer_schema(self, collection_name: str, sample_size: int = 100) -> Dict:
        """
        Infer collection schema by sampling documents
        
        Args:
            collection_name: Name of the collection
            sample_size: Number of documents to sample
            
        Returns:
            Dictionary with inferred schema information
        """
        try:
            collection = self.db[collection_name]
            documents = list(collection.find().limit(sample_size))
            
            if not documents:
                return {
                    'success': True,
                    'collection': collection_name,
                    'count': 0,
                    'schema': {}
                }
            
            # Infer schema
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
                        schema[key]['examples'].append(self.serialize_document(value))
            
            # Calculate percentages
            for key in schema:
                schema[key]['percentage'] = round((schema[key]['count'] / len(documents)) * 100, 2)
            
            return {
                'success': True,
                'collection': collection_name,
                'totalCount': collection.count_documents({}),
                'sampledCount': len(documents),
                'schema': schema
            }
        except PyMongoError as e:
            logger.error(f"Error inferring schema: {e}")
            return {'success': False, 'error': str(e)}
    
    def create_index(self, collection_name: str, keys: List[tuple], **kwargs) -> Dict:
        """Create an index on a collection"""
        try:
            collection = self.db[collection_name]
            index_name = collection.create_index(keys, **kwargs)
            return {
                'success': True,
                'indexName': index_name,
                'message': f"Index '{index_name}' created successfully"
            }
        except PyMongoError as e:
            logger.error(f"Error creating index: {e}")
            return {'success': False, 'error': str(e)}
    
    def list_indexes(self, collection_name: str) -> Dict:
        """List all indexes on a collection"""
        try:
            collection = self.db[collection_name]
            indexes = list(collection.list_indexes())
            return {
                'success': True,
                'indexes': self.serialize_document(indexes)
            }
        except PyMongoError as e:
            logger.error(f"Error listing indexes: {e}")
            return {'success': False, 'error': str(e)}


# Utility function to convert natural language to MongoDB query (placeholder)
def nl_to_mongo_query(natural_language: str, collection_schema: Dict) -> Dict:
    """
    Convert natural language to MongoDB query
    This is a placeholder for future ML model integration
    
    Args:
        natural_language: User's natural language query
        collection_schema: Schema of the target collection
        
    Returns:
        MongoDB query object
    """
    # TODO: Implement ML-based translation
    # For now, return empty query
    logger.warning("NL-to-MongoDB translation not yet implemented")
    return {}


# Example usage
if __name__ == "__main__":
    # Example: Connect and perform operations
    client = MongoDBClient(
        uri="mongodb+srv://user:pass@cluster.mongodb.net/?appName=App",
        database_name="test_db"
    )
    
    if client.connect():
        # List collections
        collections = client.list_collections()
        print(f"Collections: {collections}")
        
        # Find documents
        result = client.find("users", {"age": {"$gte": 18}}, limit=10)
        print(f"Found {result['count']} documents")
        
        # Infer schema
        schema = client.infer_schema("users")
        print(f"Schema: {schema}")
        
        client.disconnect()
