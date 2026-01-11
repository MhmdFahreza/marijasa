// scripts/hash-admin-password.js
const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = 'admin1234';
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password:', password);
  console.log('Bcrypt Hash:', hash);
  console.log('\nGunakan query berikut:');
  console.log(`UPDATE admins SET password = '${hash}', updated_at = NOW() WHERE email = 'Marijasa@gmail.com';`);
}

hashPassword();