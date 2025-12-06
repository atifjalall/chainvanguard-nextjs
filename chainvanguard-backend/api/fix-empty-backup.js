/**
 * Emergency script to mark empty backup as FAILED and use previous good backup
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Import models
const BackupLogSchema = new mongoose.Schema({
  backupId: String,
  backupType: String,
  status: String,
  timestamp: Date,
  cid: String,
  metadata: Object
}, { collection: 'backuplogs' });

const BackupLog = mongoose.model('BackupLog', BackupLogSchema);

async function fixEmptyBackup() {
  try {
    console.log('🔧 Fixing empty backup issue...\n');

    // Connect to MongoDB
    const MONGO_URI = process.env.MONGO_URI;
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the empty backup
    const emptyBackup = await BackupLog.findOne({
      backupId: 'FULL_20251204_131039'
    });

    if (emptyBackup) {
      console.log('❌ Found empty backup:');
      console.log(`   ID: ${emptyBackup.backupId}`);
      console.log(`   CID: ${emptyBackup.cid}`);
      console.log(`   Status: ${emptyBackup.status}`);
      console.log(`   Size: ${emptyBackup.metadata?.totalSize || 0} bytes`);

      // Mark as FAILED
      emptyBackup.status = 'FAILED';
      emptyBackup.metadata = emptyBackup.metadata || {};
      emptyBackup.metadata.failureReason = 'Empty backup created while MongoDB was unavailable';
      await emptyBackup.save();

      console.log('\n✅ Marked empty backup as FAILED\n');
    }

    // Find the previous good backup
    const goodBackup = await BackupLog.findOne({
      backupId: 'FULL_20251204_130330',
      status: 'ACTIVE'
    });

    if (goodBackup) {
      console.log('✅ Found previous good backup:');
      console.log(`   ID: ${goodBackup.backupId}`);
      console.log(`   CID: ${goodBackup.cid}`);
      console.log(`   Status: ${goodBackup.status}`);
      console.log(`   Size: ${goodBackup.metadata?.totalSize || 0} bytes`);
      console.log(`   Documents: ${goodBackup.metadata?.totalDocuments || 0}`);
    } else {
      console.error('❌ Could not find previous good backup!');
    }

    console.log('\n📝 Summary:');
    console.log('   - Empty backup (FULL_20251204_131039) marked as FAILED');
    console.log('   - System will now use previous backup (FULL_20251204_130330) from blockchain');
    console.log('   - Blockchain automatically skips FAILED backups when querying for latest');

    await mongoose.disconnect();
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEmptyBackup();
