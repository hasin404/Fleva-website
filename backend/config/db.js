/* ==========================================================================
   FLEVA — MongoDB Connection (Serverless Compatible)
   ========================================================================== */
const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const MONGODB_ATLAS_DEFAULT = 'mongodb+srv://abrar420240_db_user:NaLRCSO6gYnXORtG@fleva.bg54fva.mongodb.net/fleva?retryWrites=true&w=majority';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || (process.env.VERCEL ? MONGODB_ATLAS_DEFAULT : 'mongodb://localhost:27017/fleva');

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      autoIndex: true,
      serverSelectionTimeoutMS: 3000,
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => {
      console.log(`✅ MongoDB connected: ${m.connection.host}`);
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`❌ MongoDB connection error: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
