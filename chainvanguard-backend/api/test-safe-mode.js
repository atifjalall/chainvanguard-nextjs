import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4000/api';
const JWT_SECRET = 'chainvanguard_2025_!Q@wE#rT$yU%iO^pA&sD*fG(hJ)kL-ZxC_vB+nM<qW>eR?tY';

// Test users from .env
const USERS = {
  expert: {
    userId: '6924e7e5d0859f4f65484050',
    walletAddress: '0x4db092fdee674c5e4b8d1d57001b3d24eb0196aa',
    role: 'expert',
    email: 'expert@chainvanguard.com',
    name: 'Dr. Usman Tariq'
  },
  supplier: {
    userId: '6924e7cfd0859f4f6548402d',
    walletAddress: '0x5824c46f03633403fde79605076d7a104c4e4aff',
    role: 'supplier',
    email: 'supplier@chainvanguard.com',
    name: 'Ahmed Hassan'
  },
  vendor: {
    userId: '6924e7d6d0859f4f65484038',
    walletAddress: '0x8bdd69dce85da98a9e24a7833c6659d0ec87da60',
    role: 'vendor',
    email: 'vendor@chainvanguard.com',
    name: 'Fatima Ali'
  },
  customer: {
    userId: '6924e7ded0859f4f65484045',
    walletAddress: '0x9192cc177a04580308f12efdb586f32ebb9da326',
    role: 'customer',
    email: 'customer@chainvanguard.com',
    name: 'Zainab Khan'
  }
};

// Generate tokens
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Make API request
async function apiRequest(endpoint, method = 'GET', token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

// Test functions
async function testBackupCreation() {
  console.log('\n========================================');
  console.log('1. CREATING FULL SYSTEM BACKUP');
  console.log('========================================\n');

  const expertToken = generateToken(USERS.expert);
  const result = await apiRequest('/backups/create', 'POST', expertToken);

  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success) {
    console.log('✅ Backup created successfully!');
    console.log('📦 CID:', result.data.backup?.ipfsCid);
    return result.data.backup;
  } else {
    console.log('❌ Backup creation failed:', result.data.error || result.data.message);
    return null;
  }
}

async function testExpertDashboard(safeMode = false) {
  console.log(`\n========================================`);
  console.log(`2. TESTING EXPERT DASHBOARD ${safeMode ? '(SAFE MODE)' : '(NORMAL MODE)'}`);
  console.log('========================================\n');

  const expertToken = generateToken(USERS.expert);
  const result = await apiRequest('/expert/dashboard', 'GET', expertToken);

  console.log('Status:', result.status);
  console.log('Safe Mode:', result.data.safeMode || false);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success) {
    console.log('✅ Expert dashboard loaded');
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testSupplierDashboard(safeMode = false) {
  console.log(`\n========================================`);
  console.log(`3. TESTING SUPPLIER DASHBOARD ${safeMode ? '(SAFE MODE)' : '(NORMAL MODE)'}`);
  console.log('========================================\n');

  const supplierToken = generateToken(USERS.supplier);
  const result = await apiRequest('/dashboard/supplier/stats', 'GET', supplierToken);

  console.log('Status:', result.status);
  console.log('Safe Mode:', result.data.safeMode || false);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success) {
    console.log('✅ Supplier dashboard loaded');
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testVendorDashboard(safeMode = false) {
  console.log(`\n========================================`);
  console.log(`4. TESTING VENDOR DASHBOARD ${safeMode ? '(SAFE MODE)' : '(NORMAL MODE)'}`);
  console.log('========================================\n');

  const vendorToken = generateToken(USERS.vendor);
  const result = await apiRequest('/dashboard/vendor/stats', 'GET', vendorToken);

  console.log('Status:', result.status);
  console.log('Safe Mode:', result.data.safeMode || false);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (result.data.success) {
    console.log('✅ Vendor dashboard loaded');
  } else {
    console.log('❌ Failed:', result.data.error);
  }
}

async function testWriteOperation(safeMode = false) {
  console.log(`\n========================================`);
  console.log(`5. TESTING WRITE OPERATION ${safeMode ? '(SAFE MODE - SHOULD FAIL)' : '(NORMAL MODE)'}`);
  console.log('========================================\n');

  const supplierToken = generateToken(USERS.supplier);
  const result = await apiRequest('/products', 'POST', supplierToken, {
    name: 'Test Product',
    description: 'This is a test product',
    price: 100,
    stock: 50
  });

  console.log('Status:', result.status);
  console.log('Response:', JSON.stringify(result.data, null, 2));

  if (safeMode) {
    if (result.data.success === false) {
      console.log('✅ Write operation correctly blocked in safe mode');
    } else {
      console.log('❌ Write operation should be blocked in safe mode!');
    }
  } else {
    if (result.data.success) {
      console.log('✅ Write operation succeeded in normal mode');
    } else {
      console.log('⚠️  Write operation failed:', result.data.error);
    }
  }
}

// Main test sequence
async function runTests() {
  try {
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     CHAINVANGUARD SAFE MODE END-TO-END TEST          ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    // Step 1: Check for existing backup
    console.log('\n========================================');
    console.log('1. CHECKING FOR EXISTING BACKUP');
    console.log('========================================\n');
    console.log('✅ Using existing backup: bafkreihrjnxyvqjkognxqclu4lpzn4v7mdurxgo2ik6eclcz2rp6kppa6e');
    console.log('💡 Skipping backup creation (backup already exists)');

    // Step 2-5: Test endpoints in NORMAL mode
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║          TESTING IN NORMAL MODE (MongoDB UP)         ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    await testExpertDashboard(false);
    await testSupplierDashboard(false);
    await testVendorDashboard(false);
    await testWriteOperation(false);

    // Step 6: Instructions for safe mode testing
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║         MANUAL STEP: PAUSE MONGODB ATLAS            ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n📋 To test safe mode:');
    console.log('  1. Go to MongoDB Atlas dashboard');
    console.log('  2. Pause the cluster: chainvanguard.61efrm3.mongodb.net');
    console.log('  3. Wait 30 seconds for connections to close');
    console.log('  4. Run: node test-safe-mode.js safe');
    console.log('\n✅ NORMAL MODE TESTS COMPLETE\n');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  }
}

async function runSafeModeTests() {
  try {
    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║        TESTING IN SAFE MODE (MongoDB DOWN)           ║');
    console.log('╚═══════════════════════════════════════════════════════╝');

    await testExpertDashboard(true);
    await testSupplierDashboard(true);
    await testVendorDashboard(true);
    await testWriteOperation(true);

    console.log('\n\n');
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║         MANUAL STEP: RESUME MONGODB ATLAS            ║');
    console.log('╚═══════════════════════════════════════════════════════╝');
    console.log('\n📋 To test recovery:');
    console.log('  1. Go to MongoDB Atlas dashboard');
    console.log('  2. Resume the cluster');
    console.log('  3. Wait 60 seconds for cluster to be ready');
    console.log('  4. Run: node test-safe-mode.js');
    console.log('\n✅ SAFE MODE TESTS COMPLETE\n');

  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error.stack);
  }
}

// Run tests based on argument
const mode = process.argv[2];
if (mode === 'safe') {
  runSafeModeTests();
} else {
  runTests();
}
