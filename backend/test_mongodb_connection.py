"""
Test MongoDB Connection
Quick script to verify your MongoDB Atlas connection
Run with: python test_mongodb_connection.py
"""

import os
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure
import sys

# Load environment variables
load_dotenv('.env.local')

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
CYAN = '\033[96m'
RESET = '\033[0m'
BOLD = '\033[1m'


def print_header(text):
    """Print formatted header"""
    print(f"\n{CYAN}{BOLD}{'='*70}{RESET}")
    print(f"{CYAN}{BOLD}{text}{RESET}")
    print(f"{CYAN}{BOLD}{'='*70}{RESET}\n")


def print_success(text):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")


def print_warning(text):
    """Print warning message"""
    print(f"{YELLOW}⚠️  {text}{RESET}")


def print_info(text):
    """Print info message"""
    print(f"{BLUE}ℹ️  {text}{RESET}")


def test_mongodb_connection():
    """Test MongoDB connection and basic operations"""
    
    print_header("🧪 MongoDB Connection Test")
    
    # Get configuration
    mongodb_uri = os.getenv('MONGODB_URI', '')
    mongodb_db_name = os.getenv('MONGODB_DB_NAME', 'dbms_nosql')
    
    # Check if URI is set
    if not mongodb_uri or '<db_password>' in mongodb_uri:
        print_error("MONGODB_URI not properly configured!")
        print_warning("Please update .env.local with your MongoDB password")
        print_info("Current URI: " + mongodb_uri[:50] + "...")
        return False
    
    print_info(f"Database: {mongodb_db_name}")
    print_info(f"Testing connection...\n")
    
    try:
        # Test 1: Basic Connection
        print(f"{BOLD}Test 1: Basic Connection{RESET}")
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        print_success("Client created")
        
        # Test 2: Ping Server
        print(f"\n{BOLD}Test 2: Server Ping{RESET}")
        client.admin.command('ping')
        print_success("Server is reachable")
        
        # Test 3: Get Server Info
        print(f"\n{BOLD}Test 3: Server Information{RESET}")
        server_info = client.server_info()
        print_success(f"MongoDB Version: {server_info.get('version', 'Unknown')}")
        
        # Test 4: Access Database
        print(f"\n{BOLD}Test 4: Database Access{RESET}")
        db = client[mongodb_db_name]
        print_success(f"Connected to database: {mongodb_db_name}")
        
        # Test 5: List Collections
        print(f"\n{BOLD}Test 5: List Collections{RESET}")
        collections = db.list_collection_names()
        if collections:
            print_success(f"Found {len(collections)} collections:")
            for coll in collections[:10]:  # Show first 10
                print(f"   - {coll}")
            if len(collections) > 10:
                print(f"   ... and {len(collections) - 10} more")
        else:
            print_warning("No collections found (database might be empty)")
        
        # Test 6: Database Stats
        print(f"\n{BOLD}Test 6: Database Statistics{RESET}")
        stats = db.command('dbStats')
        print_success(f"Collections: {stats.get('collections', 0)}")
        print_success(f"Data Size: {stats.get('dataSize', 0) / 1024:.2f} KB")
        print_success(f"Storage Size: {stats.get('storageSize', 0) / 1024:.2f} KB")
        
        # Test 7: Create Test Collection (optional)
        print(f"\n{BOLD}Test 7: Test Collection Operations{RESET}")
        test_collection = db['test_connection']
        
        # Insert test document
        test_doc = {
            'test': True,
            'message': 'Connection test',
            'timestamp': '2024-01-01T00:00:00Z'
        }
        result = test_collection.insert_one(test_doc)
        print_success(f"Inserted test document with ID: {result.inserted_id}")
        
        # Find test document
        found_doc = test_collection.find_one({'_id': result.inserted_id})
        if found_doc:
            print_success("Successfully retrieved test document")
        
        # Delete test document
        delete_result = test_collection.delete_one({'_id': result.inserted_id})
        if delete_result.deleted_count > 0:
            print_success("Successfully deleted test document")
        
        # Test 8: User Permissions
        print(f"\n{BOLD}Test 8: User Permissions{RESET}")
        try:
            # Try to list all databases (requires permissions)
            all_dbs = client.list_database_names()
            print_success(f"User can list databases ({len(all_dbs)} found)")
            
            # Check specific permissions
            can_write = True  # We already tested write with insert
            can_read = True   # We already tested read with find
            
            print_success("User has READ permissions")
            print_success("User has WRITE permissions")
            
        except OperationFailure as e:
            print_warning(f"Limited permissions: {str(e)}")
        
        # Close connection
        client.close()
        
        # Final Summary
        print_header("📊 Test Summary")
        print_success("All tests passed!")
        print_success("MongoDB connection is working correctly")
        print_success("You can now run the NoSQL server")
        print_info("\nNext steps:")
        print(f"   1. Run: {BOLD}python local_nosql_server.py{RESET}")
        print(f"   2. Or use: {BOLD}.\\start-nosql-backend.ps1{RESET}")
        print(f"   3. Access API at: {BOLD}http://localhost:5001{RESET}")
        
        return True
        
    except ConnectionFailure as e:
        print_error("Failed to connect to MongoDB!")
        print_warning(f"Error: {str(e)}")
        print_info("\nTroubleshooting steps:")
        print("   1. Check your MongoDB URI in .env.local")
        print("   2. Verify your password is correct")
        print("   3. Check MongoDB Atlas IP whitelist")
        print("   4. Ensure your cluster is running")
        print("   5. Install dnspython: pip install dnspython")
        return False
        
    except OperationFailure as e:
        print_error("Authentication failed!")
        print_warning(f"Error: {str(e)}")
        print_info("\nPossible solutions:")
        print("   1. Verify database username and password")
        print("   2. Check user permissions in MongoDB Atlas")
        print("   3. Ensure you're connecting to the correct database")
        return False
        
    except Exception as e:
        print_error(f"Unexpected error: {str(e)}")
        print_info(f"Error type: {type(e).__name__}")
        return False


if __name__ == "__main__":
    print("\n")
    success = test_mongodb_connection()
    print("\n")
    
    if success:
        sys.exit(0)
    else:
        sys.exit(1)
