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

# Fix missing columns in tables that already exist
def fix_database_schema():
    try:
        # Create a connection to the database
        connection = pymysql.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        
        cursor = connection.cursor()
        
        # Check if SettlementPeriods table needs updating
        cursor.execute("SHOW COLUMNS FROM SettlementPeriods LIKE 'TotalPendingAmount'")
        if not cursor.fetchone():
            print("Adding missing columns to SettlementPeriods table...")
            cursor.execute("ALTER TABLE SettlementPeriods ADD COLUMN TotalPendingAmount DECIMAL(10,2) DEFAULT 0")
            cursor.execute("ALTER TABLE SettlementPeriods ADD COLUMN LastBatchID VARCHAR(36)")
            print("Added missing columns to SettlementPeriods table")
            
        # Check if Settlements table needs updating
        cursor.execute("SHOW COLUMNS FROM Settlements LIKE 'DueDate'")
        if not cursor.fetchone():
            print("Adding missing columns to Settlements table...")
            cursor.execute("ALTER TABLE Settlements ADD COLUMN DueDate DATETIME")
            cursor.execute("ALTER TABLE Settlements ADD COLUMN PaymentDate DATETIME")
            print("Added missing columns to Settlements table")

        # Check if Notifications table exists
        cursor.execute("SHOW TABLES LIKE 'Notifications'")
        if not cursor.fetchone():
            print("Creating Notifications table...")
            cursor.execute("""
            CREATE TABLE Notifications (
                NotificationID INT AUTO_INCREMENT PRIMARY KEY,
                UserID INT NOT NULL,
                Message TEXT NOT NULL,
                Type VARCHAR(50) NOT NULL,
                IsRead BOOLEAN NOT NULL DEFAULT FALSE,
                CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
            )
            """)
            print("Created Notifications table")

        connection.commit()
        cursor.close()
        connection.close()
        
        print("Database schema fixes applied successfully.")
        
    except Exception as e:
        print(f"Error fixing database schema: {e}")


# Create the database before establishing the SQLAlchemy connection
create_database()

# Apply any needed fixes to the database schema
fix_database_schema()

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
