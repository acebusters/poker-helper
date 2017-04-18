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
    const headBuf = bufferShim.alloc(4);
    headBuf.writeInt8(this.type, 0);
    addr.copy(headBuf, 1, 18, 20);

    // sign and build tail
    const hash = ethUtil.sha3(this.payload);
    const sig = ethUtil.ecsign(hash, privBuf);
    const tailBuf = bufferShim.alloc(64);
    sig.r.copy(tailBuf, 0);
    sig.s.copy(tailBuf, 32);
    headBuf.writeInt8(this.payload[0], 3);
    return {
      head: headBuf,
      body: this.payload,
      tail: tailBuf,
    };
  }

  sign(privKey) {
    const bufs = this.signToBuf(privKey);
    return `${bufs.head.toString('base64')}.${bufs.body.toString('base64')}.${bufs.tail.toString('base64')}`;
  }
}
