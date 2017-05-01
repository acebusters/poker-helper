import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import Receipt, { Type } from './receipt';

chai.use(sinonChai);

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';
const ADDR = '0x82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f';

describe('receipt + signer ', () => {
  it('should allow to sign and parse leave receipt.', (done) => {
    const leaveReceipt = 'AYYP.DcNAeou6T7Y6tCA7HlJadXUqF8J48s45rhXi1Awp8Uc=.PxTMza77tCiG7BtTiHzt3SdlpIzIF0cohTOlkCtoh+A=.HN3u/wARIjMAAABNIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    const tableAddr = '0x00112233445566778899aabbccddeeff00112233';
    const handId = 77;
    const leaverAddr = '0x2222222222222222222222222222222222222222';
    const leave = new Receipt(tableAddr).leave(handId, leaverAddr);
    // test signing
    expect(leave.sign(PRIV)).to.eql(leaveReceipt);
    // test parse
    const leaveParams = ['0x0dc3407a8bba4fb63ab4203b1e525a75752a17c278f2ce39ae15e2d40c29f147', '0x3f14cccdaefbb42886ec1b53887ceddd2765a48cc81747288533a5902b6887e0', '0x1cddeeff001122330000004d2222222222222222222222222222222222222222'];
    expect(Receipt.parseToParams(leaveReceipt)).to.eql(leaveParams);
    expect(Receipt.parse(leaveReceipt)).to.eql({
      handId,
      leaverAddr,
      signer: ADDR,
      type: Type.LEAVE,
    });
    done();
  });

  it('should allow to sign and parse createConf receipt.', (done) => {
    const createConfReceipt = 'CoYP.xK7gQSQattZdutQJFJ6P73mtEfAEV1U+ag+MNXdR6+4=.d1sWw9x47P0sbo+nQyuYOSlLlYNG2dRx3qW/h9anjq4=.G1j5n9ERfFKppFlKb57SILcToezQAAAAAAAAAAAAAAA=';
    const created = 1492754385;
    const accountId = '117c52a9-a459-4a6f-9ed2-20b713a1ecd0';
    const createConf = new Receipt().createConf(accountId, created);
    // test signing
    expect(createConf.sign(PRIV)).to.eql(createConfReceipt);
    // test parse
    expect(Receipt.parse(createConfReceipt)).to.eql({
      created,
      accountId,
      signer: ADDR,
      type: Type.CREATE_CONF,
    });
    done();
  });

  it('should allow to sign and parse resetConf receipt.', (done) => {
    const created = Math.floor(Date.now() / 1000);
    const accountId = '117c52a9-a459-4a6f-9ed2-20b713a1ecd0';
    const resetConf = new Receipt().resetConf(accountId);
    const resetConfReceipt = resetConf.sign(PRIV);
    // test parse
    expect(Receipt.parse(resetConfReceipt)).to.eql({
      created,
      accountId,
      signer: ADDR,
      type: Type.RESET_CONF,
    });
    done();
  });

  it('should allow to sign and parse forward receipt.', (done) => {
    const forwardReceipt = 'M4YP.ssWLFaCbDjXhPdVDkKrYDiAo16+TtONErnPI6VIGvr8=.UcgndJYfxVAX4fEsfd+yvTrjmybGWPJalDgR/G3lDfQ=.HN3u/wARIjMAAAAOgujGz0LI0f+VlLF6P1DpShLMhg8=.ESIzRA==';
    const nonce = 14;
    const controllerAddr = '0x00112233445566778899aabbccddeeff00112233';
    const data = '0x11223344';
    const msg = new Receipt(controllerAddr).forward(nonce, ADDR, data);
    // test signing
    expect(msg.sign(PRIV)).to.eql(forwardReceipt);
    // test parse
    // <1b nonce><7b target><4b nonce><20b destinationAddr>
    const payload = '0x1cddeeff001122330000000e82e8c6cf42c8d1ff9594b17a3f50e94a12cc860f';
    expect(Receipt.parseToParams(forwardReceipt)[2]).to.eql(payload);
    expect(Receipt.parse(forwardReceipt)).to.eql({
      nonce,
      destinationAddr: ADDR,
      data,
      signer: ADDR,
      type: Type.FORWARD,
    });
    done();
  });

  it('should allow to sign and parse message receipt.', (done) => {
    const messageReceipt = 'KYYP.3fV+4qaDrIMB+GjyfIQJujsgNxhGjuuaivICqJr9H1c=.B6UynSr11/bwtHL2tosHNB/Q4/DBP9tKXk1H80TCQS0=.HAABW48YSGiC6MbPQsjR/5WUsXo/UOlKEsyGDwAAAAc=.bWVzc2FnZQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const created = 1492754385000;
    const tableAddr = ADDR;
    const msg = new Receipt(tableAddr).message('message', created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      tableAddr,
      message: 'message',
      signer: ADDR,
      type: Type.MESSAGE,
    });
    done();
  });

  it('should allow to sign and parse message receipt with BMP chars.', (done) => {
    const messageReceipt = 'KYYP.IpNEj7TQmEDZzKNdAG6d1XsT1kRd4L7r5Wj511O2Qso=.F7rnKnat4vIMWy7fBW6FZ0QaXK9Edz94KEaYgvywS4s=.GwABW48YSGiC6MbPQsjR/5WUsXo/UOlKEsyGDwAAABc=.SGVsbG/nq5wgw7Yg4oKsIM6pIPCdhJ4AAAAAAAAAAAA=';
    const created = 1492754385000;
    const tableAddr = ADDR;
    const msg = new Receipt(tableAddr).message('Hello竜 ö € Ω 𝄞', created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      tableAddr,
      message: 'Hello竜 ö € Ω 𝄞',
      signer: ADDR,
      type: Type.MESSAGE,
    });
    done();
  });

  it('should allow to sign and parse message receipt longer than 32 bytes.', (done) => {
    const messageReceipt = 'KYYP.LSOfxEvdB1ByY1V8hWULcymLxUfWHrY17T1FQvWQ4SQ=.EFerTKZLPZD4zDrAn9ZwFN0LwWB2EuUarufhQe8LoR8=.HAABW48YSGiC6MbPQsjR/5WUsXo/UOlKEsyGDwAAAEE=.bWVzc2FnZSB0aGF0IGhhcyBtb3JlIGNoYXJhY3RlcnM=.IHRoYW4gMzIgYnl0ZXMsIDY1IHRvIGJlIHByZWNpc2U=.LgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    const created = 1492754385000;
    const tableAddr = ADDR;
    const text = 'message that has more characters than 32 bytes, 65 to be precise.';
    const msg = new Receipt(tableAddr).message(text, created);
    // test signing
    expect(msg.sign(PRIV)).to.eql(messageReceipt);
    // test parse
    expect(Receipt.parse(messageReceipt)).to.eql({
      created,
      tableAddr,
      message: text,
      signer: ADDR,
      type: Type.MESSAGE,
    });
    done();
  });

  it('should allow to sign and parse rake request receipt.', (done) => {
    const rakeRequest = 'FIYP.0YPwSYVMvQ3UjwB2bJ6HbtqWaDfWSEwVaVF1M9x9W5s=.HIMG77HuVprucZq5iVSlnHbyUdgj6HUXFxpyxS8Kaqw=.GwARIjNEVWZ3iJmqu8zd7v8AESIzAAAATQAAAAAAAAA=';
    const tableAddr = '0x00112233445566778899aabbccddeeff00112233';
    const handId = 77;
    const rakeReq = new Receipt(tableAddr).rakeRequest(handId);
    // test signing
    expect(rakeReq.sign(PRIV)).to.eql(rakeRequest);
    // test parse
    expect(Receipt.parse(rakeRequest)).to.eql({
      handId,
      signer: ADDR,
      type: Type.RAKE_REQ,
    });
    done();
  });

  it('should allow to sign and parse recovery receipt.', (done) => {
    const recoveryReceipt = 'HoYP.DcNAeou6T7Y6tCA7HlJadXUqF8J48s45rhXi1Awp8Uc=.PxTMza77tCiG7BtTiHzt3SdlpIzIF0cohTOlkCtoh+A=.HN3u/wARIjMAAABNIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    const targetAddr = '0x00112233445566778899aabbccddeeff00112233';
    const nonce = 77;
    const newSignerAddr = '0x2222222222222222222222222222222222222222';
    const recovery = new Receipt(targetAddr).recover(nonce, newSignerAddr);
    // test signing
    expect(recovery.sign(PRIV)).to.eql(recoveryReceipt);
    // test parse
    expect(Receipt.parse(recoveryReceipt)).to.eql({
      nonce,
      newSignerAddr,
      signer: ADDR,
      type: Type.RECOVERY,
    });
    done();
  });

  it('should fail with invalid sig.', (done) => {
    const leaveReceipt = 'AYYP.dcNAeou6T7Y6TCA7HlJadXUqF8J48s45rhXi1Awp8Uc=.PxTMza77tCiG7BtTiHzt3SdlpIzIF0cohTOlkCtoh+A=.HN3u/wARIjMAAABNIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    // test parse
    try {
      Receipt.parseToParams(leaveReceipt);
    } catch (e) {
      done();
    }
    throw new Error('should have thrown');
  });
});
