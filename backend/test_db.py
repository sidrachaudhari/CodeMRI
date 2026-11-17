
from sqlalchemy import text
from app.database.connection import engine


def test_database_connection():
    try:
        with engine.connect() as connection:

            result = connection.execute(
                text("""
                    SELECT
                        current_database(),
                        current_user,
                        version()
                """)
            )

            database, user, version = result.fetchone()

            print("\n================================")
            print("       CODEMRI DATABASE")
            print("================================")
            print("Connection Status :", "SUCCESS")
            print("Database Name     :", database)
            print("Database User     :", user)
            print("PostgreSQL Version:", version.split(",")[0])
            print("================================\n")

    except Exception as error:
        print("\nDATABASE CONNECTION FAILED")
        print("Error:", error)


if __name__ == "__main__":
    test_database_connection()
