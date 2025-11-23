import { MongoClient, MongoClientOptions } from 'mongodb';
import { attachDatabasePool } from '@vercel/functions';
import mongoose from "mongoose";

const options: MongoClientOptions = {
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
};
const client = new MongoClient(process.env.MONGODB_URI!, options);

   
// Attach the client to ensure proper cleanup on function suspension
attachDatabasePool(client);


// Export a module-scoped MongoClient to ensure the client can be shared across functions.
export default client; 

const MONGODB_URI = process.env.MONGODB_URI as string;

export async function connectToDB() {
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");

  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  return mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}