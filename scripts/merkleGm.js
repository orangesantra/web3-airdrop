const crypto = require('crypto'); // Import crypto module for hashing

function createMerkleTree(data) {
  if (data.length === 1) return data[0]; // Base case: single element

  const leaves = data.map(char => crypto.createHash('sha256').update(char).digest('hex')); // Hash each character

  const pairs = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = leaves[i + 1] || left; // Handle odd number of elements
    const concat = left + right;
    pairs.push(crypto.createHash('sha256').update(concat).digest('hex'));
  }

  return createMerkleTree(pairs); // Recursively build the tree
}

const data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
const merkleRoot = createMerkleTree(data);

console.log('Merkle Root:', merkleRoot);