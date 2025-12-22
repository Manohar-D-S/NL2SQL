#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
until PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d postgres -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - creating databases..."

# Create databases (cannot be in transaction)
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d postgres <<-EOSQL
CREATE DATABASE students_db;
CREATE DATABASE retail_db;
CREATE DATABASE appdb;
EOSQL

echo "Databases created successfully"

echo "Seeding students_db..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d students_db < /docker-entrypoint-initdb.d/02-seed-students-db.sql

echo "Seeding retail_db..."
PGPASSWORD="$POSTGRES_PASSWORD" psql -h localhost -U "$POSTGRES_USER" -d retail_db < /docker-entrypoint-initdb.d/03-seed-retail-db.sql

echo "All databases seeded successfully"
