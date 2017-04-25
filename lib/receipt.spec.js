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
