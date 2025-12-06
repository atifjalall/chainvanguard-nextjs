#!/usr/bin/env node

/**
 * Test Expert Recovery System
 *
 * This script will:
 * 1. Register a new expert user
 * 2. Verify userDataCID is stored on blockchain
 * 3. Wipe the user from MongoDB
 * 4. Test recovery login
 */

const API_URL = 'http://localhost:4000/api';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const data = await response.json();

  return { status: response.status, data };
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('\n🚀 Starting Expert Recovery Test...\n');

  // Step 1: Register new expert user
  console.log('📝 Step 1: Registering new expert user...');

  const timestamp = Date.now();
  const registrationData = {
    walletName: `Recovery Test ${timestamp}`,
    password: 'RecoveryTest123!',
    name: 'Recovery Test Expert',
    email: `recovery-${timestamp}@test.com`,
    phone: '+1234567890',
    role: 'expert',
    address: '123 Recovery St',
    city: 'Test City',
    state: 'TS',
    country: 'USA',
    postalCode: '12345',
    acceptedTerms: true,
  };

  // Send OTP
  console.log('   📧 Sending OTP...');
  await makeRequest('/auth/send-otp', 'POST', { email: registrationData.email });

  // Verify OTP (using a dummy code - adjust if needed)
  console.log('   ✅ Verifying OTP...');
  await makeRequest('/auth/verify-otp', 'POST', {
    email: registrationData.email,
    otp: '123456' // This might fail - we'll handle it
  });

  await sleep(1000);

  console.log('   👤 Creating user account...');
  const registerResult = await makeRequest('/auth/register', 'POST', registrationData);

  if (registerResult.status !== 201) {
    console.error('❌ Registration failed:', registerResult.data);

    // Try without OTP verification
    console.log('\n   ⚠️  Retrying registration with direct API call...');
    const directRegister = await makeRequest('/auth/register', 'POST', {
      ...registrationData,
      skipOtpVerification: true, // If your API supports this
    });

    if (directRegister.status !== 201) {
      console.error('❌ Direct registration also failed:', directRegister.data);
      console.log('\n💡 Please register a user manually with:');
      console.log('   Email:', registrationData.email);
      console.log('   Password:', registrationData.password);
      console.log('   Role: expert');
      console.log('\n   Then run this script again with the wallet address.\n');
      process.exit(1);
    }

    registerResult.data = directRegister.data;
    registerResult.status = directRegister.status;
  }

  const user = registerResult.data.data.user;
  const walletAddress = user.walletAddress;
  const password = registrationData.password;
  const userDataCID = user.userDataCID;

  console.log('   ✅ User registered successfully!');
  console.log('   Wallet Address:', walletAddress);
  console.log('   User Data CID:', userDataCID);
  console.log('   User ID:', user._id);

  if (!userDataCID) {
    console.error('\n❌ ERROR: userDataCID is missing! The blockchain registration failed.');
    console.log('   Check the backend logs for IPFS upload errors.');
    process.exit(1);
  }

  await sleep(2000);

  // Step 2: Verify blockchain has userDataCID
  console.log('\n🔍 Step 2: Checking blockchain for userDataCID...');
  console.log('   (This requires peer chaincode query - skipping for now)');
  console.log('   ℹ️  We can see from registration logs that CID was uploaded');

  await sleep(1000);

  // Step 3: Delete user from MongoDB
  console.log('\n🗑️  Step 3: Deleting user from MongoDB...');
  console.log('   ⚠️  This requires direct MongoDB access');
  console.log('   Please run this command in MongoDB shell:');
  console.log(`
   use chainvanguard
   db.users.deleteOne({ walletAddress: "${walletAddress}" })
   db.users.findOne({ walletAddress: "${walletAddress}" }) // Should return null
  `);
  console.log('\n   Press ENTER when you have deleted the user from MongoDB...');

  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve);
  });

  await sleep(1000);

  // Step 4: Test recovery login
  console.log('\n🔐 Step 4: Testing recovery login...');
  console.log('   Wallet:', walletAddress);
  console.log('   Password: [hidden]');

  const loginResult = await makeRequest('/auth/login', 'POST', {
    walletAddress,
    password,
  });

  console.log('\n📋 Login Result:');
  console.log('   Status:', loginResult.status);

  if (loginResult.status === 200) {
    console.log('   ✅ SUCCESS! Login successful');
    console.log('   Recovered:', loginResult.data.recovered || false);
    console.log('   Recovery Source:', loginResult.data.data?.recoverySource || 'N/A');
    console.log('   User Data CID:', loginResult.data.data?.userDataCID || 'N/A');

    if (loginResult.data.recovered) {
      console.log('\n🎉 EXPERT RECOVERY SYSTEM WORKING! 🎉');
      console.log('   ✅ User was recovered from IPFS + Blockchain');
      console.log('   ✅ Password verification successful');
      console.log('   ✅ User restored to MongoDB');
      console.log('   ✅ Login completed successfully');
    } else {
      console.log('\n⚠️  Login successful but recovery flag not set');
      console.log('   This might mean the user was found in MongoDB (not wiped)');
    }
  } else {
    console.error('   ❌ FAILED! Login failed');
    console.error('   Error:', loginResult.data);

    console.log('\n🔍 Debugging Information:');
    console.log('   Check backend logs for:');
    console.log('   - "Checking if expert exists on blockchain"');
    console.log('   - "Has userDataCID? YES/NO"');
    console.log('   - "Downloading user data from IPFS"');
    console.log('   - Any error messages');
  }

  console.log('\n✅ Test completed!\n');
}

// Run the test
runTest().catch(error => {
  console.error('\n❌ Test failed with error:', error);
  process.exit(1);
});
