const https = require('https');

const BACKEND_URL = 'https://backend-1-7yki.onrender.com';

function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`Testing: ${url}`);
    
    https.get(url, (res) => {
      console.log(`  Status: ${res.statusCode}`);
      console.log(`  Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ✅ Success: ${endpoint}`);
          resolve({ status: res.statusCode, data: data.substring(0, 200) + '...' });
        } else {
          console.log(`  ❌ Failed: ${endpoint} - ${res.statusCode}`);
          resolve({ status: res.statusCode, error: data });
        }
      });
    }).on('error', (err) => {
      console.log(`  ❌ Error: ${endpoint} - ${err.message}`);
      reject(err);
    });
  });
}

async function runTests() {
  console.log('🔍 Testing Backend Connectivity\n');
  
  const endpoints = [
    '/',
    '/api/weighing-categories',
    '/api/organizations',
    '/api/users'
  ];
  
  for (const endpoint of endpoints) {
    try {
      await testEndpoint(endpoint);
      console.log('');
    } catch (error) {
      console.log(`  ❌ Network Error: ${error.message}\n`);
    }
  }
  
  console.log('🏁 Backend testing completed');
}

runTests(); 