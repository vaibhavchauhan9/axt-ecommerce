import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      autoIndex: true, // Build indexes automatically for schema performance queries
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Connection Failure: ${error.message}`);
    // Exit application loop with failure signature
    process.exit(1);
  }
};

// Monitor ongoing application lifecycle connections
mongoose.connection.on('disconnected', () => {
  console.warn('[Database Warning] MongoDB connection dropped. Attempting reconnection...');
});

mongoose.connection.on('error', (err) => {
  console.error(`[Database Error] Runtime connection glitch: ${err.message}`);
});

export default connectDB;