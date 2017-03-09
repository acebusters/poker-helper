import ethUtil from 'ethereumjs-util';
import Signer from './signer';

export const Type = {
  leave: 1,
  bet: 2,
  distribution: 3,
};

export default class Receipt {

  // leave create a leave receipt
  static leave(tableAddr, handId, signerAddr) {
    // make leave receipt
      // <4 bytes hand ID>
      // <7 bytes table addr>
      // <20 bytes signer addr>
      // <32 r><32 s><1 v>
    const payload = Buffer.alloc(31);
    payload.writeUInt32BE(handId, 0);
    payload.write(tableAddr.replace('0x','').substring(26, 40), 4, 'hex');
    payload.write(signerAddr.replace('0x',''), 11, 'hex');
    return new Signer(arguments, payload, Type.leave);
  }

  static parse(receipt) {
    const parts = receipt.split('.');
    const headBuf = Buffer.alloc(3, parts[0], 'base64');
    const type = headBuf.readInt8(0);
    const check = headBuf.toString('hex', 1, 2);
    switch(type) {
      case Type.leave:
          const bodyBuf = Buffer.alloc(31, parts[1], 'base64');
          const tailBuf = Buffer.alloc(65, parts[2], 'base64');
          const r = tailBuf.slice(0, 32);
          const s = tailBuf.slice(32, 64);
          const v = tailBuf.readInt8(64);
          const hash = ethUtil.sha3(bodyBuf);
          const pub = ethUtil.ecrecover(hash, v, r, s);
          const addr = ethUtil.publicToAddress(pub);
          if (addr.compare(headBuf, 1, 3, 18, 20) !== 0) {
            throw 'signature verification failed';
          }
          const handId = bodyBuf.readUInt32BE(handId, 0);
          const signerAddr = `0x${bodyBuf.slice(11, 31).toString('hex')}`;
          return { handId, signerAddr };
        break;
      default:
        return;
    }
    const rec = new Buffer(hex.replace('0x',''), 'hex');

  }

}