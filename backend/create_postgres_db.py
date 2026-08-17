import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / '.env')

DB_NAME = os.environ.get('DB_NAME', 'idhayam_erp')
DB_USER = os.environ.get('DB_USER', os.environ.get('POSTGRES_USER', 'postgres'))
DB_PASSWORD = os.environ.get('DB_PASSWORD', os.environ.get('POSTGRES_PASSWORD', 'postgres'))
DB_HOST = os.environ.get('DB_HOST', os.environ.get('POSTGRES_HOST', '127.0.0.1'))
DB_PORT = os.environ.get('DB_PORT', os.environ.get('POSTGRES_PORT', '5432'))

def create_database():
    print(f"Connecting to PostgreSQL server at {DB_HOST}:{DB_PORT} as user '{DB_USER}'...")
    try:
        conn = psycopg2.connect(
            dbname='postgres',
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = %s;", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            print(f"Database '{DB_NAME}' does not exist. Creating database...")
            cursor.execute(f'CREATE DATABASE "{DB_NAME}";')
            print(f"Database '{DB_NAME}' created successfully.")
        else:
            print(f"Database '{DB_NAME}' already exists.")
            
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"Error connecting/creating PostgreSQL database: {e}")
        print("Note: Ensure PostgreSQL is running and update credentials in backend/.env if needed.")
        return False

def run_migrations_and_seeds():
    print("Running Django migrations...")
    os.chdir(BASE_DIR)
    exit_code = os.system(f"{sys.executable} manage.py migrate")
    if exit_code == 0:
        print("Migrations completed successfully.")
        print("Seeding metadata...")
        os.system(f"{sys.executable} seed_ui_metadata.py")
    else:
        print(f"Migrations returned exit code {exit_code}")

if __name__ == '__main__':
    success = create_database()
    if success:
        run_migrations_and_seeds()
