const crypto = require('crypto');

// Your PayFast credentials from config
const merchantId = '31731849';
const passphrase = '2025CVsiftSecure';
const subscriptionToken = 'eb3186f4-eaa9-44e8-8e81-fcd024b01c64';

// Test timestamp formats
const timestamp1 = new Date().toISOString(); // With milliseconds: 2025-11-24T10:22:05.123Z
const timestamp2 = new Date().toISOString().replace(/\.\d{3}Z$/, "Z"); // Without milliseconds: 2025-11-24T10:22:05Z
const timestamp3 = new Date().toISOString().replace(/\.\d{3}/, ""); // Without milliseconds and Z: 2025-11-24T10:22:05

console.log('Testing PayFast API Signature Generation\n');
console.log('Merchant ID:', merchantId);
console.log('Subscription Token:', subscriptionToken);
console.log('\n=== Timestamp Formats ===');
console.log('Format 1 (with milliseconds):', timestamp1);
console.log('Format 2 (without milliseconds, with Z):', timestamp2);
console.log('Format 3 (without milliseconds, no Z):', timestamp3);

function generateSignature(timestamp) {
  const params = {
    "merchant-id": merchantId,
    "version": "v1",
    "timestamp": timestamp,
  };

  // Sort alphabetically
  const sortedKeys = Object.keys(params).sort();
  const paramArray = [];
  for (const key of sortedKeys) {
    const value = params[key].toString().trim();
    paramArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  let queryString = paramArray.join("&");
  console.log('\nQuery string (before passphrase):', queryString);

  // Append passphrase
  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  console.log('Query string (with passphrase):', queryString);

  // Generate MD5 hash
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  console.log('Generated signature:', signature);

  return signature;
}

console.log('\n=== Test 1: Current Implementation (timestamp2) ===');
const sig1 = generateSignature(timestamp2);

console.log('\n=== Test 2: Alternative Format (timestamp3) ===');
const sig2 = generateSignature(timestamp3);

console.log('\n=== Headers that would be sent ===');
console.log({
  "merchant-id": merchantId,
  "version": "v1",
  "timestamp": timestamp2,
  "signature": sig1
});

console.log('\n=== API Endpoint ===');
console.log(`PUT https://api.payfast.co.za/subscriptions/${subscriptionToken}/cancel`);
