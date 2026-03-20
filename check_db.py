import sqlite3

def check_schema():
    conn = sqlite3.connect('alphasignal.db')
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in alphasignal.db:")
    for table_name in tables:
        print(f"\nTable: {table_name[0]}")
        cursor.execute(f"PRAGMA table_info({table_name[0]})")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
    conn.close()

if __name__ == "__main__":
    check_schema()
