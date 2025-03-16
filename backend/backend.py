import mysql.connector

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "nalin@482",
    "database": "RoomiePayDB"
}

# Read SQL queries from databasecmd.txt
with open("databasecmd.txt", "r") as file:
    sql_queries = file.read().split(";")

try:
    connection = mysql.connector.connect(**db_config)
    cursor = connection.cursor()

    for query in sql_queries:
        query = query.strip()
        if not query:
            continue 

        try:
            cursor.execute(query)

            if query.lower().startswith("select"):
                results = cursor.fetchall()
                print(f"🔍 Executed SELECT: {query[:50]}... → {len(results)} rows returned")

                for row in results:
                    print(row)

            else:
                print(f"✅ Executed: {query[:50]}...")

            while cursor.nextset():
                cursor.fetchall()

        except mysql.connector.Error as err:
            print(f"❌ Error executing query: {query[:50]}... → {err}")

    print("\n📊 **Final Table Data**")
    tables = ["Users", "UserGroups", "GroupMembers", "Expenses", "Settlements", "Invitations"]
    for table in tables:
        try:
            cursor.execute(f"SELECT * FROM {table};")
            rows = cursor.fetchall()
            print(f"\n📌 Table: {table} ({len(rows)} rows)")
            for row in rows:
                print(row)
        except mysql.connector.Error as err:
            print(f"❌ Error fetching data from {table}: {err}")

    connection.commit()
    print("\n✅ All queries executed successfully!")

except mysql.connector.Error as err:
    print(f"\n❌ Database connection error: {err}")

finally:
    try:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
            print("\n🔒 MySQL connection closed.")
    except Exception as e:
        print(f"⚠️ Error closing connection: {e}")
