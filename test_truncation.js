const { truncateToBytes } = require('./server/modules/filesystem/sanitizer');

const testCases = [
  { str: 'hello', max: 5, expected: 'hello' },
  { str: 'hello', max: 3, expected: 'hel' },
  { str: '👋hello', max: 4, expected: '👋' }, // 👋 is 4 bytes
  { str: '👋hello', max: 3, expected: '' },
  { str: '👋hello', max: 5, expected: '👋h' },
  { str: '你好', max: 3, expected: '你' }, // 你 is 3 bytes
  { str: '你好', max: 2, expected: '' },
  { str: '你好', max: 6, expected: '你好' },
];

testCases.forEach(({ str, max, expected }) => {
  const result = truncateToBytes(str, max);
  console.log(`str: "${str}", max: ${max}, result: "${result}", expected: "${expected}", pass: ${result === expected}`);
});
