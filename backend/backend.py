import mysql.connector

# Database connection settings
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Bunny",  # Your MySQL password
    "database": "SplitwiseDB"
}

# List of tables to fetch data from
tables = ["user", "login", "register", "group", "admin", "member", "expense", "settlements"]

try:
    # Connect to MySQL
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()

    # Loop through each table and fetch data
    for table in tables:
        print(f"\n🔹 Data from {table} table:")
        cursor.execute(f"SELECT * FROM `{table}`;")
        rows = cursor.fetchall()
        
        # Fetch column names
        columns = [desc[0] for desc in cursor.description]
        print(columns)  # Print column names
        
        # Print table data
        for row in rows:
            print(row)

    # Close connection
    cursor.close()
    conn.close()

except mysql.connector.Error as err:
    print(f"Error: {err}")
