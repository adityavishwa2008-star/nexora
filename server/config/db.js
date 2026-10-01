import mongoose from 'mongoose';

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI || !/^mongodb(?:\+srv)?:\/\//.test(mongoURI)) {
    console.error('MONGO_URI is missing or invalid in server/.env');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    throw new Error(`MongoDB connection failed: ${error.message}`);
  }
};

export default connectDB;
