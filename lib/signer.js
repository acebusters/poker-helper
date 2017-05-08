import ethUtil from 'ethereumjs-util';

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
    const headBuf = Buffer.alloc(3);
    headBuf.writeInt8(this.type, 0);
    addr.copy(headBuf, 1, 18, 20);

    // sign and build tail
    const hash = ethUtil.sha3(Buffer.concat(this.payload));
    const sig = ethUtil.ecsign(hash, privBuf);
    this.payload[0].writeInt8(sig.v, 0);
    const bytes32 = [sig.r, sig.s, this.payload[0]];
    for (let i = 1; i < this.payload.length; i += 1) {
      bytes32.push(this.payload[i]);
    }
    return {
      head: headBuf,
      bytes32,
    };
  }

  sign(privKey) {
    const bufs = this.signToBuf(privKey);
    let rv = bufs.head.toString('base64');
    bufs.bytes32.forEach((buf) => {
      rv += `.${buf.toString('base64')}`;
    });
    return rv;
  }
}
