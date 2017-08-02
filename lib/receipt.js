import ethUtil from 'ethereumjs-util';
import BigNumber from 'bignumber.js';
import Signer from './signer';

export const Type = {
  // PLAYERS RECEIPTS
  LEAVE: 1,
  BET: 2,
  CHECK_PRE: 3,
  CHECK_FLOP: 4,
  CHECK_TURN: 5,
  CHECK_RIVER: 6,
  FOLD: 7,
  SIT_OUT: 8,
  SHOW: 9,
  // SESSION RECEIPTS
  CREATE_CONF: 10,
  RESET_CONF: 11,
  // ORACLE RECEIPTS
  DIST: 21,
  SETTLE: 25,
  // RECOVERY RECEIPTS
  RECOVERY: 30,
  UNLOCK: 31,
  UNLOCK_REQUEST: 32,
  MESSAGE: 41,
  FORWARD: 51,
};

const jozDecimals = new BigNumber(10).pow(9);

function payReceipt(type, targetAddr, ...args) {
  const [handId, babzAmount] = args;
    // size: 32bytes receipt
  const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
  payload.writeUInt8(0, 0);
    // <3 bytes targetAddr>
  payload.write(targetAddr.replace('0x', '').substring(34, 40), 1, 'hex');
    // <4 bytes handId>
  payload.writeUInt32BE(handId, 4);
    // <1 bytes receipt type>
  payload.writeUInt8(type, 8);
    // TODO: check max bet
    // 1000 * 100 JOHNYZ  ~= 1 USD
    // 6 bytes for amount => (2^ 48) / 100000 => maxBet 2.800.000.000 USD
    // <6 bytes amount in JOHNYZ>
  const jozAmount = ethUtil.setLengthLeft(babzAmount.div(jozDecimals).toNumber(), 6);
  jozAmount.copy(payload, 9);
  return payload;
}

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
  constructor(targetAddr) {
    this.targetAddr = targetAddr;
  }

  // leave create a leave receipt
  // a leave receipts is signed by the oracle to exit a player from the table
  // at a specific handId.
  // when the leave receipt is accepted in the contract, the exitHand of the player
  // is set to the handId provider in the receipt
  // and a nettingRequest is created at handId
  leave(...args) {
    const [handId, leaverAddr] = args;
    // make leave receipt
    // size: 32bytes receipt
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <7 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes handId>
    payload.writeUInt32BE(handId, 8);
    // <20 bytes signerAddr>
    payload.write(leaverAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.LEAVE);
  }

  bet(...args) {
    const payload = payReceipt(Type.BET, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.BET);
  }

  checkPre(...args) {
    const payload = payReceipt(Type.CHECK_PRE, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.CHECK_PRE);
  }

  checkFlop(...args) {
    const payload = payReceipt(Type.CHECK_FLOP, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.CHECK_FLOP);
  }

  checkTurn(...args) {
    const payload = payReceipt(Type.CHECK_TURN, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.CHECK_TURN);
  }

  checkRiver(...args) {
    const payload = payReceipt(Type.CHECK_RIVER, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.CHECK_RIVER);
  }

  fold(...args) {
    const payload = payReceipt(Type.FOLD, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.FOLD);
  }

  sitOut(...args) {
    const payload = payReceipt(Type.SIT_OUT, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.SIT_OUT);
  }

  show(...args) {
    const payload = payReceipt(Type.SHOW, this.targetAddr, ...args);
    return new Signer(args, [payload], Type.SHOW);
  }

  /**
  * distribution receipt
  */
  dist(...args) {
    const [handId, claimId, babzOuts] = args;
    // size: 64bytes receipt
    const payload = Buffer.alloc(64);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <3 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(34, 40), 1, 'hex');
    // <4 bytes handId>
    payload.writeUInt32BE(handId, 4);
    // <1 bytes receipt type>
    payload.writeUInt8(Type.DIST, 8);
    // <1 bytes claimId>
    payload.writeUInt8(claimId, 9);

    // pairs of: <1b pos><6b amount>
    // 3 in first receipt
    // 4 in next
    // max 7 outs in one hand
    let pos = 0;
    for (let i = 0; i < babzOuts.length; i += 1) {
      if (babzOuts[i] > 0) {
        let jozAmount = babzOuts[i].div(jozDecimals);
        jozAmount = ethUtil.setLengthLeft(jozAmount.toNumber(), 6);
        payload.writeUInt8(i, 11 + (pos * 7));
        jozAmount.copy(payload, 12 + (pos * 7));
        pos += 1;
      }
    }
    // <1 bytes outs>
    payload.writeUInt8(pos, 10);
    return new Signer(args, [payload.slice(0, 32), payload.slice(32, 64)], Type.DIST);
  }

  settle(...args) {
    // structure is
    // <1b dest><1b dest><1b handsNetted><1b lhn>[2-10x<6b signed diff>]
    const [fromHandId, toHandId, babzAmounts] = args;

    const payload = Buffer.alloc(64);
    // <4 bytes handId>
    payload.writeUInt32BE(fromHandId, 0);
    payload.writeUInt8(0, 0);
    // <1b targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(38, 40), 1, 'hex');
    // <1b handsNetted>
    payload.writeUInt8(toHandId - fromHandId, 2);
    let jozAmount;
    for (let i = 0; i < babzAmounts.length; i += 1) {
      jozAmount = babzAmounts[i].div(jozDecimals);
      if (jozAmount < 0) {
        jozAmount = new BigNumber(2).pow(49).sub(jozAmount.abs());
      }
      jozAmount = ethUtil.setLengthLeft(jozAmount.toNumber(), 6);
      jozAmount.copy(payload, 4 + (i * 6));
    }
    return new Signer(args, [payload.slice(0, 32), payload.slice(32, 64)], Type.SETTLE);
  }

  forward(...args) {
    const [nonce, destinationAddr, amount, data] = args;
    const dataHex = data.replace('0x', '');
    const dataBuf = Buffer.alloc(dataHex.length / 2);
    dataBuf.write(dataHex, 'hex');
    let amountBuf;
    if (typeof amount === 'undefined') {
      amountBuf = Buffer.alloc(32);
    }
    if (typeof amount === 'object' && amount.toNumber) {
      amountBuf = ethUtil.setLengthLeft(amount.toNumber(), 32);
    }
    if (!amountBuf) {
      amountBuf = ethUtil.setLengthLeft(amount, 32);
    }
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <7 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes nonce>
    payload.writeUInt32BE(nonce, 8);
    // <20 bytes destinationAddr>
    payload.write(destinationAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload, amountBuf, dataBuf], Type.FORWARD);
  }

  message(...args) {
    const [msg, created = Date.now()] = args;
    const msgLength = Buffer.byteLength(msg, 'utf8');
    // make message receipt
    // 1b 0x00 space for v
    // 7b for time in milli
    // 20b table address
    // 4b for msg length in bytes
    // 1 + 7 + 20 + 4 + msgLength < 32 * 8
    if (msgLength > 32 * 7) {
      throw Error(`msg too long:${msgLength}`);
    }
    // Buffer.alloc(size[, fill[, encoding]])
    // If fill is undefined, the Buffer will be zero-filled.
    const sliceCount = Math.floor(msgLength / 32) + 2;
    const payload = Buffer.alloc(sliceCount * 32);
    // write timestamp to buffer
    const MAX_UINT32 = 0xFFFFFFFF;
    const big = ~~(created / MAX_UINT32); // eslint-disable-line no-bitwise
    const low = (created % MAX_UINT32) - big;
    payload.writeUInt32BE(big, 0);
    payload.writeUInt32BE(low, 4);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <20 bytes tableAddr>
    payload.write(this.targetAddr.replace('0x', ''), 8, 'hex');
    // <4 bytes message length>
    payload.writeUInt32BE(msgLength, 28);
    // <xx bytes message>
    payload.write(msg, 32, 'utf8');
    const slices = [];
    for (let i = 0; i < sliceCount; i += 1) {
      slices.push(payload.slice(i * 32, (i + 1) * 32));
    }
    return new Signer(args, slices, Type.MESSAGE);
  }

  /**
  * create Confirmation is sent to user by Email when signing up
  */
  createConf(...args) { // eslint-disable-line class-methods-use-this
    const [accountId, created = Math.floor(Date.now() / 1000)] = args;
    const payload = Buffer.alloc(32, 0);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <4 bytes created time>
    payload.writeUInt32BE(created, 1);
    // <16 bytes account uuid>
    payload.write(accountId.replace(/-/g, ''), 5, 'hex');
    return new Signer(args, [payload], Type.CREATE_CONF);
  }

  /**
  * reset Confirmation is sent to user by Email when asking for password reset
  */
  resetConf(...args) { // eslint-disable-line class-methods-use-this
    const [accountId, oldSignerAddr, created = Math.floor(Date.now() / 1000)] = args;
    const payload = Buffer.alloc(64, 0);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <4 bytes created time>
    payload.writeUInt32BE(created, 1);
    // <16 bytes account uuid>
    payload.write(accountId.replace(/-/g, ''), 5, 'hex');
    // <20 bytes oldSignerAddr>
    payload.write(oldSignerAddr.replace('0x', ''), 21, 'hex');
    return new Signer(args, [payload.slice(0, 32), payload.slice(32, 64)], Type.RESET_CONF);
  }

  /**
  * this receipt is sent to account controller contract
  * to change the signer address to a new one
  */
  recover(...args) {
    const [nonce, newSignerAddr] = args;
    // size: 32bytes receipt
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <7 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(26, 40), 1, 'hex');
    // <4 bytes nonce>
    payload.writeUInt32BE(nonce, 8);
    // <20 bytes newSignerAddr>
    payload.write(newSignerAddr.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.RECOVERY);
  }

  unlockRequest(...args) { // eslint-disable-line class-methods-use-this
    const [newOwner, created = Math.floor(Date.now() / 1000)] = args;
    const payload = Buffer.alloc(32, 0);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <4 bytes created time>
    payload.writeUInt32BE(created, 1);
    // <20 bytes newOwner>
    payload.write(newOwner.replace('0x', ''), 5, 'hex');
    return new Signer(args, [payload], Type.UNLOCK_REQUEST);
  }

  unlock(...args) {
    const [newOwner] = args;
    // make leave receipt
    // size: 32bytes receipt
    const payload = Buffer.alloc(32);
    // <1 bytes 0x00 space for v>
    payload.writeUInt8(0, 0);
    // <11 bytes targetAddr>
    payload.write(this.targetAddr.replace('0x', '').substring(18, 40), 1, 'hex');
    // <20 bytes signerAddr>
    payload.write(newOwner.replace('0x', ''), 12, 'hex');
    return new Signer(args, [payload], Type.UNLOCK);
  }

  static parseToParams(receipt) {
    const bufs = this.parseToBuf(receipt);
    if (bufs.type === Type.SETTLE) {
      const v = bufs.parts[2].readUInt8(0);
      bufs.parts[2].writeUInt8(0, 0);
      return [`0x${v.toString(16)}${bufs.parts[0].toString('hex')}${bufs.parts[1].toString('hex')}`, `0x${bufs.parts[2].toString('hex')}`, `0x${bufs.parts[3].toString('hex')}`];
    }
    return bufs.parts.map(buf => `0x${buf.toString('hex')}`);
  }

  static parse(receipt) {
    const bufs = this.parseToBuf(receipt);
    const rv = { signer: bufs.signer, type: bufs.type };
    switch (bufs.type) {
      case Type.RESET_CONF: {
        const p = bufs.parts[2];
        const p2 = bufs.parts[3];
        rv.created = p.readUInt32BE(1);
        rv.accountId = `${p.slice(5, 9).toString('hex')}-${p.slice(9, 11).toString('hex')}-${p.slice(11, 13).toString('hex')}-${p.slice(13, 15).toString('hex')}-${p.slice(15, 21).toString('hex')}`;
        rv.oldSignerAddr = `0x${p.slice(21, 32).toString('hex')}${p2.slice(0, 9).toString('hex')}`;
        break;
      }
      case Type.CREATE_CONF: {
        const p = bufs.parts[2];
        rv.created = p.readUInt32BE(1);
        rv.accountId = `${p.slice(5, 9).toString('hex')}-${p.slice(9, 11).toString('hex')}-${p.slice(11, 13).toString('hex')}-${p.slice(13, 15).toString('hex')}-${p.slice(15, 21).toString('hex')}`;
        break;
      }
      case Type.LEAVE: {
        rv.handId = bufs.parts[2].readUInt32BE(8);
        rv.leaverAddr = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        break;
      }
      case Type.UNLOCK_REQUEST: {
        rv.created = bufs.parts[2].readUInt32BE(1);
        rv.newOwner = `0x${bufs.parts[2].slice(5, 25).toString('hex')}`;
        break;
      }
      case Type.SETTLE: {
        const payload = Buffer.concat([bufs.parts[2], bufs.parts[3]]);
        rv.amounts = [];
        for (let i = 0; i < 10; i += 1) {
          rv.amounts[i] = new BigNumber(payload.readIntBE(4 + (i * 6), 6)).mul(jozDecimals);
        }
        rv.handsNetted = bufs.parts[2].readUInt8(2);
        rv.lhnByte = bufs.parts[2].readUInt8(3);
        break;
      }
      case Type.CHECK_PRE:
      case Type.CHECK_FLOP:
      case Type.CHECK_TURN:
      case Type.CHECK_RIVER:
      case Type.FOLD:
      case Type.SIT_OUT:
      case Type.SHOW:
      case Type.BET: {
        rv.handId = bufs.parts[2].readUInt32BE(4);
        rv.amount = new BigNumber(bufs.parts[2].readUIntBE(9, 6)).mul(jozDecimals);
        break;
      }
      case Type.DIST: {
        rv.handId = bufs.parts[2].readUInt32BE(4);
        rv.claimId = bufs.parts[2].readUInt8(9);
        rv.outs = [];
        const size = bufs.parts[2].readUInt8(10);
        for (let i = 0; i < size; i += 1) {
          const pos = bufs.parts[2].readUInt8(11 + (i * 7));
          const amount = new BigNumber(bufs.parts[2].readUIntBE(12 + (i * 7), 6)).mul(jozDecimals);
          rv.outs[pos] = amount;
        }
        for (let i = 0; i < rv.outs.length; i += 1) {
          if (!rv.outs[i]) {
            rv.outs[i] = new BigNumber(0);
          }
        }
        break;
      }
      case Type.RECOVERY: {
        rv.nonce = bufs.parts[2].readUInt32BE(8);
        rv.newSignerAddr = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        break;
      }
      case Type.UNLOCK: {
        rv.newOwner = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        break;
      }
      case Type.FORWARD: {
        rv.nonce = bufs.parts[2].readUInt32BE(8);
        rv.destinationAddr = `0x${bufs.parts[2].slice(12, 32).toString('hex')}`;
        rv.amount = new BigNumber(bufs.parts[3].toString('hex'), 16);
        rv.data = `0x${bufs.parts[4].toString('hex')}`;
        break;
      }
      case Type.MESSAGE: {
        rv.created = parseInt(bufs.parts[2].slice(1, 8).toString('hex'), 16);
        rv.tableAddr = `0x${bufs.parts[2].slice(8, 28).toString('hex')}`;
        let msgLength = bufs.parts[2].readUInt32BE(28);
        const partsLength = Math.floor(msgLength / 32) + 1;
        rv.message = '';
        for (let i = 0; i < partsLength; i += 1) {
          if (msgLength >= 32) {
            rv.message += bufs.parts[3 + i].toString('utf8');
          } else {
            rv.message += bufs.parts[3 + i].slice(0, msgLength).toString('utf8');
          }
          msgLength -= 32;
        }
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

    const headBuf = Buffer.alloc(3);
    headBuf.write(parts[0], 'base64');
    const type = headBuf.readUInt8(0);

    const r = Buffer.alloc(32);
    r.write(parts[1], 'base64');
    const s = Buffer.alloc(32);
    s.write(parts[2], 'base64');
    const first = Buffer.alloc(32);
    first.write(parts[3], 'base64');
    const v = first.readUInt8(0);
    first.writeUInt8(0, 0);
    const partBufs = [r, s];
    let hash;
    switch (type) {
      case Type.UNLOCK_REQUEST:
      case Type.CREATE_CONF:
      case Type.RECOVERY:
      case Type.BET:
      case Type.CHECK_PRE:
      case Type.CHECK_FLOP:
      case Type.CHECK_TURN:
      case Type.CHECK_RIVER:
      case Type.FOLD:
      case Type.SIT_OUT:
      case Type.SHOW:
      case Type.UNLOCK:
      case Type.LEAVE: {
        hash = ethUtil.sha3(first);
        first.writeUInt8(v, 0);
        partBufs.push(first);
        break;
      }
      case Type.FORWARD: {
        const dataLength = Buffer.byteLength(parts[5], 'base64');
        const data = Buffer.alloc(dataLength);
        data.write(parts[5], 'base64');
        const amountBuf = Buffer.alloc(32);
        amountBuf.write(parts[4], 'base64');
        hash = ethUtil.sha3(Buffer.concat([first, amountBuf, data]));
        first.writeUInt8(v, 0);
        partBufs.push(first);
        partBufs.push(amountBuf);
        partBufs.push(data);
        break;
      }
      case Type.SETTLE:
      case Type.RESET_CONF:
      case Type.DIST: {
        const second = Buffer.alloc(32);
        second.write(parts[4], 'base64');
        hash = ethUtil.sha3(Buffer.concat([first, second]));
        first.writeUInt8(v, 0);
        partBufs.push(first);
        partBufs.push(second);
        break;
      }
      case Type.MESSAGE: {
        partBufs.push(null);
        const payloadBufs = [first];
        for (let i = 4; i < parts.length; i += 1) {
          const partBuf = Buffer.alloc(32);
          partBuf.write(parts[i], 'base64');
          partBufs.push(partBuf);
          payloadBufs.push(partBuf);
        }
        hash = ethUtil.sha3(Buffer.concat(payloadBufs));
        first.writeUInt8(v, 0);
        partBufs[2] = first;
        break;
      }
      default: {
        throw new Error(`unknown receipt type: ${type}.`);
      }
    }
    const pub = ethUtil.ecrecover(hash, v, r, s);
    const signer = ethUtil.publicToAddress(pub);
    if (headBuf[1] !== signer[18] || headBuf[2] !== signer[19]) {
      throw new Error('signature verification failed');
    }
    return {
      type,
      parts: partBufs,
      signer: `0x${signer.toString('hex')}`,
    };
  }

}
