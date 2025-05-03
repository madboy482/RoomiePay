from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
import urllib.parse

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