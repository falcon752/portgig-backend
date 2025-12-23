import { MongoClient } from "mongodb";

const uri = "mongodb+srv://portgigcom:agWtZoEASCs2VugC@cluster0.nxdlncw.mongodb.net/portgig?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB Atlas!");
    await client.db().command({ ping: 1 });
    console.log("✅ Ping successful");
    await client.close();
  } catch (err) {
    console.error("❌ Connection failed:", err);
  }
}

testConnection();
