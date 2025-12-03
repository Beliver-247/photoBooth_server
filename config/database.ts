import mongoose from 'mongoose';
import { config } from '.';
import { Session } from '../models/Session';

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('✅ MongoDB connected successfully');
    
    // Drop existing problematic indexes and create the correct sparse unique index
    try {
      await Session.collection.dropIndex('slug_1');
      console.log('🔧 Dropped old slug_1 index');
    } catch (err: any) {
      // Index might not exist, that's ok
      if (err.code !== 27) {
        console.log('ℹ️  No old index to drop');
      }
    }
    
    // Manually create the sparse unique index
    await Session.collection.createIndex(
      { slug: 1 }, 
      { unique: true, sparse: true, name: 'slug_1' }
    );
    console.log('🔧 Created sparse unique index on slug');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
