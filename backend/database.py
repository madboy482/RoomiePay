from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import urllib.parse

load_dotenv()

# Get database credentials from environment variables
db_user = os.getenv('DB_USER', '')
db_password = os.getenv('DB_PASSWORD', '')
db_host = os.getenv('DB_HOST', '')
db_name = os.getenv('DB_NAME', '')

# Check if the password contains characters that need to be encoded
special_chars = ['@', '/', '?', '%', '#', '&', '+']
needs_encoding = any(char in db_password for char in special_chars)

# Encode the password if it contains special characters
if needs_encoding:
    encoded_password = urllib.parse.quote_plus(db_password)
else:
    encoded_password = db_password

# Construct the database URL
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{db_user}:{encoded_password}@{db_host}/{db_name}"

# Create the SQLAlchemy engine
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