import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const JWT = process.env.PINATA_JWT;

console.log('JWT exists:', !!JWT);
console.log('JWT length:', JWT?.length);
console.log('JWT first 50 chars:', JWT?.substring(0, 50));

try {
  const response = await axios.get('https://api.pinata.cloud/data/testAuthentication', {
    headers: {
      'Authorization': `Bearer ${JWT}`
    }
  });
  console.log('\n✅ Pinata JWT is VALID!');
  console.log('Response:', response.data);
} catch (error) {
  console.log('\n❌ Pinata JWT is INVALID or EXPIRED!');
  console.log('Error:', error.response?.status, error.response?.statusText);
  console.log('Message:', error.response?.data);
}
