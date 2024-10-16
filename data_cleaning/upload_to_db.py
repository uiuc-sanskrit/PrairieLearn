# Created by Rohan Kapur on 2024/10/10
# File to clean and upload sandhi CSV to dev MySQL database
# Requires .env file with the following variables:
# - DB_USER
# - DB_PASSWORD

# connect to MySQL database
import os
import mysql.connector
import csv
from dotenv import load_dotenv
from tqdm import tqdm
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

# Insert CSV using column names
with open('data_cleaning/sandhi_corpus.csv') as csvfile:
    csvreader = csv.reader(csvfile)
    next(csvreader)
    for row in tqdm(csvreader):
      cursor.execute("INSERT INTO sandhi_playground (joint_word, split_word) VALUES (%s, %s)", (row[0], row[1]))

db.commit()
print("uploaded sandhi CSV to MySQL database")
cursor.close()