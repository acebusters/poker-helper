import ethUtil from 'ethereumjs-util';
import bufferShim from 'buffer-shims';
import Signer from './signer';

export const Type = {
  leave: 1,
  bet: 2,
  distribution: 3,
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

  // leave create a leave receipt
  // a leave receipts is signed by the oracle to exit a player from the table
  // at a specific handId.
  // when the leave receipt is accepted in the contract, the exitHand of the player
  // is set to the handId provider in the receipt
  // and a nettingRequest is created for handId
  static leave(...args) {
    const [tableAddr, handId, signerAddr] = args;
    // make leave receipt
      // <1 bytes 0x00 space for v>
      // <7 bytes tableAddr>
      // <4 bytes handId>
      // <20 bytes signerAddr>
      // size: 32bytes
    const payload = bufferShim.alloc(32);
    payload.writeInt8(0, 0);
    payload.write(tableAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    payload.writeUInt32BE(handId, 8);
    payload.write(signerAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, payload, Type.leave);
  }

  static parseToHex(receipt) {
    const bufs = this.parseToBuf(receipt);
    // const handId = bufs.body.readUInt32BE(0);
    return `0x${bufs.body.toString('hex')}${bufs.tail.toString('hex')}`;
  }

  static parse(receipt) {
    const bufs = this.parseToBuf(receipt);
    const handId = bufs.body.readUInt32BE(0);
    const signerAddr = `0x${bufs.body.slice(11, 31).toString('hex')}`;
    return { handId, signerAddr };
  }

  static parseToBuf(receipt) {
    const parts = receipt.split('.');
    const headBuf = bufferShim.alloc(4, parts[0], 'base64');
    const type = headBuf.readInt8(0);
    const v = headBuf.readInt8(3);
    const tailBuf = bufferShim.alloc(64, parts[2], 'base64');
    const r = tailBuf.slice(0, 32);
    const s = tailBuf.slice(32, 64);
    switch (type) {
      case Type.leave: {
        const bodyBuf = bufferShim.alloc(32, parts[1], 'base64');
        const hash = ethUtil.sha3(bodyBuf);
        const pub = ethUtil.ecrecover(hash, v, r, s);
        const addr = ethUtil.publicToAddress(pub);
        if (headBuf[1] !== addr[18] || headBuf[2] !== addr[19]) {
          throw new Error('signature verification failed');
        }
        return {
          type,
          body: bodyBuf,
          tail: tailBuf,
        };
      }
      default: {
        throw new Error(`unknown receipt type: ${type}.`);
      }
    }
  }

}
