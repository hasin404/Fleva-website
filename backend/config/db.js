/* ==========================================================================
   FLEVA — MongoDB Connection (Serverless Compatible)
   ========================================================================== */
const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fleva';

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
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
