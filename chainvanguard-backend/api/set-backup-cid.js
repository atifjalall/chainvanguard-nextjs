#!/usr/bin/env node

/**
 * Set Backup CID in Redis
 *
 * This script manually sets the latest_backup_cid in Redis
 * Use this when you need to point safe mode to a specific backup
 */

import Redis from 'ioredis';

const BACKUP_CID = process.argv[2];

if (!BACKUP_CID) {
  console.log('❌ Usage: node set-backup-cid.js <CID>');
  console.log('');
  console.log('Example:');
  console.log('  node set-backup-cid.js bafkreiabc123...');
  console.log('');
  console.log('To find your backup CID:');
  console.log('  1. Connect MongoDB');
  console.log('  2. Check: curl http://localhost:4000/api/backups/list -H "Authorization: Bearer $EXPERT_TOKEN"');
  console.log('  3. Copy the CID from the latest backup');
  process.exit(1);
}

async function main() {
  const redis = new Redis({
    host: '127.0.0.1',
    port: 6379
  });

  redis.on('error', (err) => {
    console.error('❌ Redis error:', err.message);
    process.exit(1);
  });

  redis.on('connect', async () => {
    console.log('✅ Connected to Redis');

    // Set the CID with 7 day TTL
    await redis.set('latest_backup_cid', BACKUP_CID, 'EX', 86400 * 7);

    console.log('✅ Set latest_backup_cid:', BACKUP_CID);
    console.log('   TTL: 7 days');

    // Verify
    const stored = await redis.get('latest_backup_cid');
    console.log('✅ Verified:', stored);

    await redis.quit();
    console.log('✅ Done!');
  });
}

main();
