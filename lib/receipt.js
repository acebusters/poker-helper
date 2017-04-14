import ethUtil from 'ethereumjs-util';
import bufferShim from 'buffer-shims';
import Signer from './signer';

export const Type = {
  leave: 1,
  bet: 2,
  distribution: 3,
};

export default class Receipt {

  // leave create a leave receipt
  static leave(...args) {
    const [tableAddr, handId, signerAddr] = args;
    // make leave receipt
      // <4 bytes hand ID>
      // <7 bytes table addr>
      // <20 bytes signer addr>
      // <32 r><32 s><1 v>
    const payload = bufferShim.alloc(31);
    payload.writeUInt32BE(handId, 0);
    payload.write(tableAddr.replace('0x', '').substring(26, 40), 4, 'hex');
    payload.write(signerAddr.replace('0x', ''), 11, 'hex');
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
    const headBuf = bufferShim.alloc(3, parts[0], 'base64');
    const type = headBuf.readInt8(0);
    switch (type) {
      case Type.leave: {
        const bodyBuf = bufferShim.alloc(31, parts[1], 'base64');
        const tailBuf = bufferShim.alloc(65, parts[2], 'base64');
        const r = tailBuf.slice(0, 32);
        const s = tailBuf.slice(32, 64);
        const v = tailBuf.readInt8(64);
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
