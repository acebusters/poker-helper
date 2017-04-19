import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import Receipt from './receipt';

chai.use(sinonChai);

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

describe('receipt + signer ', () => {
  it('should allow to sign and parse leave receipt.', (done) => {
    const leaveReceipt = 'AYYP.DcNAeou6T7Y6tCA7HlJadXUqF8J48s45rhXi1Awp8Uc=.PxTMza77tCiG7BtTiHzt3SdlpIzIF0cohTOlkCtoh+A=.HN3u/wARIjMAAABNIiIiIiIiIiIiIiIiIiIiIiIiIiI=';
    const tableAddr = '0x00112233445566778899aabbccddeeff00112233';
    const handId = 77;
    const signerAddr = '0x2222222222222222222222222222222222222222';
    const leave = new Receipt(tableAddr).leave(handId, signerAddr);
    // test signing
    expect(leave.sign(PRIV)).to.eql(leaveReceipt);
    // test parse
    const leaveParams = ['0x0dc3407a8bba4fb63ab4203b1e525a75752a17c278f2ce39ae15e2d40c29f147', '0x3f14cccdaefbb42886ec1b53887ceddd2765a48cc81747288533a5902b6887e0', '0x1cddeeff001122330000004d2222222222222222222222222222222222222222'];
    expect(Receipt.parseToParams(leaveReceipt)).to.eql(leaveParams);
    expect(Receipt.parse(leaveReceipt)).to.eql({ handId, signerAddr });
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
