/**
 * Test script to create a new backup with password hashes included
 * and verify safe mode login works correctly
 */

const EXPERT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OTJmNTc4ZDhjMDdkOWRmZWM1NzgxYWYiLCJlbWFpbCI6InNhbW9raWI5MzBAZG9jc2Z5LmNvbSIsInJvbGUiOiJleHBlcnQiLCJpYXQiOjE3NjQ3Njk5MjcsImV4cCI6MTc2NDg1NjMyN30.iOnT7w_nrmJB-3gvcLObOPt7f-XMreCHrOgcPbZ0BA8";
const API_BASE = "http://localhost:4000/api";

async function createNewBackup() {
  console.log('\n📦 Step 1: Creating new backup with password hashes...\n');

  try {
    const response = await fetch(`${API_BASE}/backups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EXPERT_TOKEN}`
      },
      body: JSON.stringify({
        type: 'full',
        description: 'Test backup with password hashes for safe mode login'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Backup creation failed:', data);
      return null;
    }

    console.log('✅ Backup created successfully!');
    console.log(`   Backup ID: ${data.backupId}`);
    console.log(`   CID: ${data.cid}`);
    console.log(`   Size: ${(data.totalSize / 1024 / 1024).toFixed(2)} MB`);

    return data;
  } catch (error) {
    console.error('❌ Error creating backup:', error.message);
    return null;
  }
}

async function verifyPasswordInBackup(backupCID) {
  console.log('\n🔍 Step 2: Verifying password hashes are in backup...\n');

  try {
    // Download the backup from IPFS and check if users have password field
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${backupCID}`);
    const backupText = await response.text();

    const lines = backupText.split('\n').filter(line => line.trim());

    let userWithPassword = null;

    if (lines.length === 1) {
      // Old format
      const backup = JSON.parse(lines[0]);
      if (backup.collections && backup.collections.users && backup.collections.users.length > 0) {
        userWithPassword = backup.collections.users[0];
      }
    } else {
      // NDJSON format
      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const record = JSON.parse(line);
          if (record.type === 'user') {
            userWithPassword = record.data;
            break;
          }
        } catch (e) {
          continue;
        }
      }
    }

    if (userWithPassword) {
      if (userWithPassword.password || userWithPassword.passwordHash) {
        console.log('✅ Password hash found in backup!');
        console.log(`   User: ${userWithPassword.email}`);
        console.log(`   Has password field: ${!!userWithPassword.password}`);
        console.log(`   Has passwordHash field: ${!!userWithPassword.passwordHash}`);
        return true;
      } else {
        console.error('❌ Password hash NOT found in backup');
        console.log('   User data:', JSON.stringify(userWithPassword, null, 2));
        return false;
      }
    } else {
      console.error('❌ No users found in backup');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying backup:', error.message);
    return false;
  }
}

async function testSafeModeLogin() {
  console.log('\n🧪 Step 3: Testing safe mode login...\n');
  console.log('Instructions:');
  console.log('1. Stop MongoDB or change the connection URI to simulate failure');
  console.log('2. Restart the server to activate safe mode');
  console.log('3. Try logging in with your credentials');
  console.log('\nTest credentials from previous session:');
  console.log('   Wallet: 0x1adec49025081d0eb599317b080c1523db3d1d05');
  console.log('   Password: QWErtz123$');
  console.log('\nExpected result:');
  console.log('   ✅ Login should succeed using backup data');
  console.log('   ✅ Response should include safeMode: true');
  console.log('   ✅ No "Illegal arguments" error');
}

async function main() {
  console.log('='.repeat(80));
  console.log('🧪 Testing Safe Mode Login with Password Hashes');
  console.log('='.repeat(80));

  // Step 1: Create new backup
  const backup = await createNewBackup();

  if (!backup) {
    console.error('\n❌ Failed to create backup. Exiting.');
    process.exit(1);
  }

  // Wait a bit for backup to be uploaded to IPFS
  console.log('\n⏳ Waiting 5 seconds for IPFS upload...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Verify password is in backup
  const hasPassword = await verifyPasswordInBackup(backup.cid);

  if (!hasPassword) {
    console.error('\n❌ Password not found in backup. The fix may not be working correctly.');
    process.exit(1);
  }

  // Step 3: Show manual testing instructions
  await testSafeModeLogin();

  console.log('\n' + '='.repeat(80));
  console.log('✅ All automated checks passed!');
  console.log('📝 Follow the manual testing instructions above to complete the test.');
  console.log('='.repeat(80) + '\n');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
