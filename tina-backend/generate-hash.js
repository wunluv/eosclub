import bcrypt from 'bcryptjs';

const password = process.argv[2];

if (!password) {
  console.log('Usage: node generate-hash.js <your-password>');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
console.log('--- GENERATED HASH ---');
console.log(hash);
console.log('-----------------------');
