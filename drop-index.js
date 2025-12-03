require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('MONGODB_URI not found in environment variables');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');

    const db = mongoose.connection.db;
    
    // Drop the problematic index
    try {
      await db.collection('sessions').dropIndex('slug_1');
      console.log('✅ Dropped slug_1 index');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('ℹ️  Index slug_1 not found (already dropped or never existed)');
      } else {
        throw err;
      }
    }

    // Optionally clear all sessions to start fresh
    const count = await db.collection('sessions').countDocuments();
    console.log(`📊 Current sessions count: ${count}`);
    
    const answer = process.argv[2];
    if (answer === '--clear') {
      await db.collection('sessions').deleteMany({});
      console.log('🗑️  All sessions cleared');
    }

    console.log('✅ Done! Restart the server.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

dropIndex();
