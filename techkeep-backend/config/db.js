const { MongoClient } = require("mongodb");
require("dotenv").config();

const client = new MongoClient(process.env.MONGODB_URI);

async function connectDB() {
  await client.connect();
  console.log("Connected to MongoDB!");
  return client.db("TechKeep");
}

module.exports = connectDB;