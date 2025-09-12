const bcrypt = require('bcryptjs');

(async () => {
  const plain = 'MyStrongPass123';

  // Simulate saving to DB
  const hash = await bcrypt.hash(plain, 10);
  console.log('Hash stored in DB:', hash);

  // Simulate login check
  const result = await bcrypt.compare(plain, hash);
  console.log('✅ Password matches:', result);
})();
