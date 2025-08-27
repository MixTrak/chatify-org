import { MongoClient, GridFSBucket, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// First, declare the global augmentation
declare global {
  var mongo: {
    conn: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!process.env.MONGO_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const uri = process.env.MONGO_URI;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

// GridFS bucket for file storage
export async function getGridFSBucket(): Promise<GridFSBucket> {
  const client = await clientPromise;
  const db: Db = client.db('next-message');
  return new GridFSBucket(db, { bucketName: 'images' });
}

// Database instance
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db('next-message');
}
