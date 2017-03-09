import ethUtil from 'ethereumjs-util';

export default class Signer {
  constructor(values, payload, type) {
    this.values = values;
    this.payload = payload;
    this.type = type;
  }

  signToHex(privKey) {
    const bufs = this.signToBuf(privKey);
    return `0x${bufs.body.toString('hex')}${bufs.tail.toString('hex')}`;
  }

  signToBuf(privKey) {
    // build head
    const privBuf = new Buffer(privKey.replace('0x', ''), 'hex');
    const addr = ethUtil.privateToAddress(privBuf);
    const headBuf = Buffer.alloc(3);
    headBuf.writeInt8(this.type, 0);
    addr.copy(headBuf, 1, 18, 20);

    // sign and build tail
    const hash = ethUtil.sha3(this.payload);
    const sig = ethUtil.ecsign(hash, privBuf);
    const tailBuf = Buffer.alloc(65);
    sig.r.copy(tailBuf, 0);
    sig.s.copy(tailBuf, 32);
    tailBuf.writeInt8(sig.v, 64);
    return {
      head: headBuf,
      body: this.payload,
      tail: tailBuf,
    }
  }

  sign(privKey) {
    const bufs = this.signToBuf(privKey);
    return `${bufs.head.toString('base64')}.${bufs.body.toString('base64')}.${bufs.tail.toString('base64')}`;
  }
}
