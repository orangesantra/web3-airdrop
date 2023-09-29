const crypto = require('crypto');

// Function to compute the hash of a leaf node
function computeHash(data) {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
}

// Function to compute the Merkle root given a list of leaf nodes
function computeMerkleRoot(leafNodes) {
    if (leafNodes.length === 1) {
        return leafNodes[0];
    }

    // Hash each leaf node
    const hashedLeafNodes = leafNodes.map(node => computeHash(node));

    // Pair adjacent hashed leaf nodes and hash them together to create parent nodes
    const parentNodes = [];
    for (let i = 0; i < hashedLeafNodes.length; i += 2) {
        const leftNode = hashedLeafNodes[i];
        const rightNode = i + 1 < hashedLeafNodes.length ? hashedLeafNodes[i + 1] : hashedLeafNodes[i]; // If odd number of leaf nodes, duplicate the last one
        parentNodes.push(computeHash(leftNode + rightNode));
    }

    // Recursively compute the Merkle root
    return computeMerkleRoot(parentNodes);
}

// Given text
const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

// Treat each character as a leaf node
const leafNodes = Array.from(text);

// Compute the Merkle root
const merkleRoot = computeMerkleRoot(leafNodes);
console.log("Merkle Root:", merkleRoot);

// Function to get the Merkle proof of a leaf node
function getMerkleProof(leafIndex, leafNodes, merkleRoot) {
    if (leafNodes.length === 1) {
        return [];
    }

    const proof = [];
    let index = leafIndex;

    while (leafNodes.length > 1) {
        const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
        const siblingHash = siblingIndex < leafNodes.length ? computeHash(leafNodes[siblingIndex]) : null;

        proof.push(siblingHash);

        // Move up to the parent level
        index = Math.floor(index / 2);

        // Replace current node with its parent
        leafNodes = leafNodes.filter((_, i) => i !== siblingIndex);
    }

    return proof;
}

// Given text
const text1 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

// Treat each character as a leaf node
const leafNodes1 = Array.from(text1);

// Compute the Merkle root
const merkleRoot1 = computeMerkleRoot(leafNodes1);

// Get the index of the leaf node representing 'Z'
const indexOfZ1 = leafNodes.indexOf('Z');

// Get the Merkle proof of 'Z'
const merkleProofOfZ = getMerkleProof(indexOfZ1, leafNodes1, merkleRoot1);
console.log("Merkle Proof of Z:", merkleProofOfZ);