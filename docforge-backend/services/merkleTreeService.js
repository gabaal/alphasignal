const crypto = require('crypto');

/**
 * Computes SHA-256 hash of a input string or combined buffer
 */
function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Merkle Tree Generator & Proof Verifier for DocForge Cryptographic Ledger
 */
class MerkleTreeService {
  /**
   * Constructs a Merkle Tree from an array of leaf hashes
   * @param {Array<string>} leafHashes - Array of SHA-256 document hashes
   * @returns {Object} Tree structure containing root, layers, and leaves
   */
  buildTree(leafHashes) {
    if (!leafHashes || leafHashes.length === 0) {
      const emptyRoot = sha256('DOCFORGE_EMPTY_MERKLE_TREE');
      return { root: emptyRoot, layers: [[emptyRoot]], leaves: [] };
    }

    const leaves = leafHashes.map(h => h.toLowerCase());
    let currentLayer = [...leaves];
    const layers = [currentLayer];

    while (currentLayer.length > 1) {
      const nextLayer = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = (i + 1 < currentLayer.length) ? currentLayer[i + 1] : left;
        const combined = sha256(left + right);
        nextLayer.push(combined);
      }
      layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return {
      root: layers[layers.length - 1][0],
      layers,
      leaves
    };
  }

  /**
   * Generates Merkle Inclusion Proof for a target document hash
   * @param {Array<string>} leafHashes - All document hashes in batch
   * @param {string} targetHash - Hash to generate proof for
   * @returns {Object} Inclusion proof object
   */
  getInclusionProof(leafHashes, targetHash) {
    const tree = this.buildTree(leafHashes);
    const target = targetHash.toLowerCase();
    const index = tree.leaves.indexOf(target);

    if (index === -1) {
      return { is_valid: false, message: 'Document hash not found in Merkle tree batch.' };
    }

    const proof = [];
    let currentIndex = index;

    for (let layerIdx = 0; layerIdx < tree.layers.length - 1; layerIdx++) {
      const layer = tree.layers[layerIdx];
      const isRightNode = currentIndex % 2 === 1;
      const pairIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (pairIndex < layer.length) {
        proof.push({
          position: isRightNode ? 'left' : 'right',
          hash: layer[pairIndex]
        });
      } else {
        proof.push({
          position: 'right',
          hash: layer[currentIndex]
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      is_valid: true,
      target_hash: target,
      merkle_root: tree.root,
      leaf_index: index,
      total_leaves: tree.leaves.length,
      proof
    };
  }

  /**
   * Cryptographically verifies a Merkle inclusion proof against a root hash
   * @param {string} targetHash 
   * @param {Array<Object>} proof 
   * @param {string} expectedRoot 
   * @returns {boolean} True if proof resolves to root hash
   */
  verifyProof(targetHash, proof, expectedRoot) {
    let currentHash = targetHash.toLowerCase();

    for (const step of proof) {
      if (step.position === 'left') {
        currentHash = sha256(step.hash + currentHash);
      } else {
        currentHash = sha256(currentHash + step.hash);
      }
    }

    return currentHash.toLowerCase() === expectedRoot.toLowerCase();
  }
}

module.exports = new MerkleTreeService();
