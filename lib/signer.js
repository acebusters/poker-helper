import ethUtil from 'ethereumjs-util';
import bufferShim from 'buffer-shims';

export default class Signer {
  constructor(values, payload, type) {
    this.values = values;
    this.payload = payload;
    this.type = type;
  }

  signToBuf(privKey) {
    // build head
    const privBuf = new Buffer(privKey.replace('0x', ''), 'hex');
    const addr = ethUtil.privateToAddress(privBuf);
    const headBuf = bufferShim.alloc(3);
    headBuf.writeInt8(this.type, 0);
    addr.copy(headBuf, 1, 18, 20);

    // sign and build tail
    const hash = ethUtil.sha3(Buffer.concat(this.payload));
    const sig = ethUtil.ecsign(hash, privBuf);
    const tailBuf = bufferShim.alloc(64);
    sig.r.copy(tailBuf, 0);
    sig.s.copy(tailBuf, 32);
    this.payload[0].writeInt8(sig.v, 0);
    return {
      head: headBuf.toString('hex'),
      bytes32: this.payload,
    };
  }

  /**
  * The receipt format should be <type with leng info><2addr>.<32r>.<32s>.<1v,31pl0>[.<32pl2>[.<32pl2>]]
  */
  sign(privKey) {
    const bufs = this.signToBuf(privKey);
    return `${bufs.head.toString('base64')}.${bufs.body.toString('base64')}.${bufs.tail.toString('base64')}`;
  }
}
