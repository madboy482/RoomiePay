from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import urllib.parse
import pymysql

load_dotenv()

# Get database configuration from environment variables
DB_USER = os.getenv('DB_USER')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_HOST = os.getenv('DB_HOST')
DB_NAME = os.getenv('DB_NAME', 'RoomiePayDB')

# Check if the password contains characters that need to be encoded
special_chars = ['@', '/', '?', '%', '#', '&', '+']
needs_encoding = any(char in DB_PASSWORD for char in special_chars)

# Encode the password if it contains special characters
if needs_encoding:
    encoded_password = urllib.parse.quote_plus(DB_PASSWORD)
else:
    encoded_password = DB_PASSWORD

# Create database if it doesn't exist
def create_database():
    try:
        # Create a connection without specifying a database
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD
        )
        
        cursor = connection.cursor()
        
        # Create database if it doesn't exist
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        
        connection.commit()
        cursor.close()
        connection.close()
        
        print(f"Database '{DB_NAME}' created successfully or already exists.")
        
    except Exception as e:
        print(f"Error creating database: {e}")
        raise

# Create the database before establishing the SQLAlchemy connection
create_database()

# Now create the SQLAlchemy connection URL with the database
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{encoded_password}@{DB_HOST}/{DB_NAME}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
