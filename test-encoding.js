const crypto = require('crypto');

const merchantId = '31731849';
const passphrase = '2025CVsiftSecure';
const timestamp = '2025-11-24T10:28:19Z';

console.log('=== Testing URL Encoding Case ===\n');

// Standard JavaScript encoding (lowercase)
function generateSignatureLowercase() {
  const params = {
    "merchant-id": merchantId,
    "version": "v1",
    "timestamp": timestamp,
  };

  const sortedKeys = Object.keys(params).sort();
  const paramArray = [];
  for (const key of sortedKeys) {
    const value = params[key].toString().trim();
    paramArray.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }

  let queryString = paramArray.join("&");
  console.log('Lowercase encoding:', queryString);

  if (passphrase) {
    queryString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  console.log('With passphrase:', queryString);
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  console.log('Signature:', signature);
  return signature;
}

// PayFast required encoding (uppercase)
function generateSignatureUppercase() {
  const params = {
    "merchant-id": merchantId,
    "version": "v1",
    "timestamp": timestamp,
  };

  const sortedKeys = Object.keys(params).sort();
  const paramArray = [];
  for (const key of sortedKeys) {
    const value = params[key].toString().trim();
    // Convert URL encoding to uppercase
    const encodedKey = encodeURIComponent(key).replace(/%[0-9a-f]{2}/gi, match => match.toUpperCase());
    const encodedValue = encodeURIComponent(value).replace(/%[0-9a-f]{2}/gi, match => match.toUpperCase());
    paramArray.push(`${encodedKey}=${encodedValue}`);
  }

  let queryString = paramArray.join("&");
  console.log('\nUppercase encoding:', queryString);

  if (passphrase) {
    const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%[0-9a-f]{2}/gi, match => match.toUpperCase());
    queryString += `&passphrase=${encodedPassphrase}`;
  }

  console.log('With passphrase:', queryString);
  const signature = crypto.createHash("md5").update(queryString).digest("hex");
  console.log('Signature:', signature);
  return signature;
}

const sig1 = generateSignatureLowercase();
console.log('\n' + '='.repeat(50));
const sig2 = generateSignatureUppercase();

console.log('\n' + '='.repeat(50));
console.log('Are they different?', sig1 !== sig2 ? 'YES - This is the problem!' : 'NO - Same signature');
