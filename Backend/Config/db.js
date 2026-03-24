const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // This looks for the MONGO_URI variable inside your .env file
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1); // Stop the server if the database fails
  }
};

module.exports = connectDB;