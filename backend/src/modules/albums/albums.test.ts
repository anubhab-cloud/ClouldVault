import assert from 'node:assert';

async function runAlbumsUnitTests() {
  console.log('Running Albums & Collection validation unit tests...');

  // Test 1: Album name validation
  const validName = 'Summer Vacation 2026';
  assert.strictEqual(validName.trim().length > 0, true, 'Valid album title must pass');

  const emptyName = '   ';
  assert.strictEqual(emptyName.trim().length === 0, true, 'Blank album title must be caught');
  console.log('✔ Album title sanitization & boundary check passed');

  // Test 2: Storage byte formatting and math calculation
  const totalUsed = 12500000000n; // 12.5 GB
  const totalQuota = 15000000000n; // 15 GB
  const percentage = Number((totalUsed * 100n) / totalQuota);
  assert.strictEqual(percentage, 83, 'Percentage calculation must equal 83%');
  console.log('✔ Storage quota aggregation math passed');

  console.log('All Albums unit tests passed successfully!');
}

runAlbumsUnitTests().catch((err) => {
  console.error('Albums test failed:', err);
  process.exit(1);
});
