import ethUtil from 'ethereumjs-util';
import bufferShim from 'buffer-shims';
import Signer from './signer';

export const Type = {
  LEAVE: 1,
  BET: 2,
  DIST: 3,
};

/**
* A receipt should authenticate the signer to a contract function
* a receipt should transport a destination address, ideally a nonce
* and shall fit into few multiple of bytes32
*
* FIX_LENGTH, SINGLE RECEIPTS:
* <1 bytes 0x00 space for v>
* <x bytes for destination address> (first bytes of contract address)
* <32 -(x+1) bytes for payload>
* [<32 bytes payload>]
* [<32 bytes payload>]
* this shall fit into few multiple of bytes32
*
* FIX_LENGTH, SINGLE RECEIPTS sent to contract by:
* func name(bytes32 r, bytes32 s, bytes32 pl0, [bytes32 pl1], ...)
*
* FIX_LENGTH, MULTIPLE RECEIPTS:
* (sigs.length / 2) is the number of receipts
* (receipts.length / (sigs.length / 2)) is length of one receipt
* first byte of each receipt is v, should be replaced by 0x00 for verification
* FIX_LENGTH, MULTIPLE RECEIPTS sent to contract by:
* func name(bytes32[] sigs, bytes receipts)
*/
export default class Receipt {
  constructor(tableAddr) {
    this.tableAddr = tableAddr;
  }

  // leave create a leave receipt
  // a leave receipts is signed by the oracle to exit a player from the table
  // at a specific handId.
  // when the leave receipt is accepted in the contract, the exitHand of the player
  // is set to the handId provider in the receipt
  // and a nettingRequest is created at handId
  leave(...args) {
    const [handId, signerAddr] = args;
    // make leave receipt
    // size: 32bytes receipt
    const payload = bufferShim.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeInt8(0, 0);
    // <7 bytes tableAddr>
    payload.write(this.tableAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes handId>
    payload.writeUInt32BE(handId, 8);
    // <20 bytes signerAddr>
    payload.write(signerAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.LEAVE);
  }

  static parseToParams(receipt) {
    const bufs = this.parseToBuf(receipt);
    return bufs.parts.map((buf) => {
      return `0x${buf.toString('hex')}`;
    })
  }

  static parse(receipt) {
    const bufs = this.parseToBuf(receipt);
    let rv = {};
    switch (bufs.type) {
      case Type.LEAVE: {
        const first = bufferShim.alloc(32, bufs.parts[2], 'base64');
        rv.handId = first.readUInt32BE(8);
        rv.signerAddr = `0x${first.slice(12, 32).toString('hex')}`;
        break;
      }
      default: {
        throw new Error(`unknown receipt type: ${bufs.type}.`);
      }
    }
    return rv;
  }

  static parseToBuf(receipt) {
    const parts = receipt.split('.');
    if (parts.length < 4) {
      throw new Error('malformed receipt.');
    }
    const headBuf = bufferShim.alloc(3, parts[0], 'base64');
    const type = headBuf.readInt8(0);
    
    const r = bufferShim.alloc(32, parts[1], 'base64');
    const s = bufferShim.alloc(32, parts[2], 'base64');
    const first = bufferShim.alloc(32, parts[3], 'base64');
    const v = first.readInt8(0);
    first.writeInt8(0, 0);
    switch (type) {
      case Type.LEAVE: {
        const hash = ethUtil.sha3(first);
        const pub = ethUtil.ecrecover(hash, v, r, s);
        const addr = ethUtil.publicToAddress(pub);
        if (headBuf[1] !== addr[18] || headBuf[2] !== addr[19]) {
          throw new Error('signature verification failed');
        }
        first.writeInt8(v, 0);
        return {
          type,
          parts: [r, s, first],
        };
      }
      default: {
        throw new Error(`unknown receipt type: ${type}.`);
      }
    }
  }

}
