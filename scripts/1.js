const crypto = require('crypto');

function createMerkleTree(data) {
  if (data.length === 1) return data[0];

  const leaves = data.map(char => crypto.createHash('sha256').update(char).digest('hex'));

  const pairs = [];
  for (let i = 0; i < leaves.length; i += 2) {
    const left = leaves[i];
    const right = leaves[i + 1] || left;
    const concat = left + right;
    pairs.push(crypto.createHash('sha256').update(concat).digest('hex'));
  }

  return createMerkleTree(pairs);
}

const data = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');
const merkleRoot = createMerkleTree(data);

console.log('Merkle Root:', merkleRoot);
