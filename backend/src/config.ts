import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://apitesterdb.sflageb.mongodb.net/?retryWrites=true&w=majority';
// Database name for SLA Compliance Tracker - separated from API Tester project
const SLA_TRACKER_DB = 'sla_compliance_tracker';

export async function connectDB(): Promise<void> {
  try {
    // Create a separate connection for SLA Tracker database
    await mongoose.connect(MONGODB_URI, {
      dbName: SLA_TRACKER_DB,
      retryWrites: true,
      w: 'majority',
    });

    console.log(`✅ Connected to MongoDB - Database: ${SLA_TRACKER_DB}`);
    
    // Verify connection
    const connection = mongoose.connection;
    connection.on('connected', () => {
      console.log(`📊 SLA Tracker using database: ${SLA_TRACKER_DB}`);
    });
    
    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
}

export { SLA_TRACKER_DB };
