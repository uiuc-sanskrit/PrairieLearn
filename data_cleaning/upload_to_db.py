# Created by Rohan Kapur on 2024/10/10
# File to clean and upload sandhi CSV to dev MySQL database
# Requires .env file with the following variables:
# - DB_USER
# - DB_PASSWORD

# connect to MySQL database
import os
import mysql.connector
from dotenv import load_dotenv
load_dotenv()

# connect to MySQL database
db = mysql.connector.connect(
  host="sanskritengine.web.illinois.edu",
  user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    database="sanskritengine_dev"
)
print("connected to MySQL database")
cursor = db.cursor()

# print all tables
cursor.execute("SHOW TABLES")
tables = cursor.fetchall()
for table in tables:
    print(table)
