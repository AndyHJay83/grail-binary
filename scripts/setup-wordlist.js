#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Word Filter PWA - Word List Setup');
console.log('==================================');

const wordlistPath = path.join(__dirname, '..', 'wordlist', 'EN-UK.txt');

if (!fs.existsSync(wordlistPath)) {
  console.log('\n❌ EN-UK.txt not found in wordlist/ directory');
  console.log('\nTo add your word list:');
  console.log('1. Place your EN-UK.txt file in the wordlist/ directory');
  console.log('2. Ensure the file contains one word per line');
  console.log('3. Restart the development server');
  console.log('\nExample format:');
  console.log('aardvark');
  console.log('abacus');
  console.log('abandon');
  console.log('...');
} else {
  const stats = fs.statSync(wordlistPath);
  const wordCount = fs.readFileSync(wordlistPath, 'utf8')
    .split('\n')
    .filter(line => line.trim().length > 0 && !line.startsWith('#'))
    .length;
  
  console.log('\n✅ EN-UK.txt found!');
  console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`📝 Word count: ${wordCount.toLocaleString()} words`);
  console.log('\nThe app is ready to use! 🎉');
}

console.log('\nDevelopment server should be running at: http://localhost:3000');
console.log('\nPWA Features:');
console.log('- Installable on mobile and desktop');
console.log('- Works offline');
console.log('- Binary filtering through A-Z');
console.log('- Export filtered results'); 