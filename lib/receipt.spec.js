import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import Receipt from './receipt';

chai.use(sinonChai);

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

describe('receipt + signer ', () => {
  it('should allow to sign and parse leave receipt.', (done) => {
    const leaveReceipt = 'AYYP.AAAAIt3u/wARIjMiIiIiIiIiIiIiIiIiIiIiIiIiIg==.rRkcm8/3Spamtr20PM9wxVuLNZqnGNZSoWzKTj5k8SlC5V8bSN11/vkU7CRhEo1JpHNhsJhR70qJxCYtREbp9hs=';
    const leaveHex = '0x00000022ddeeff001122332222222222222222222222222222222222222222ad191c9bcff74a96a6b6bdb43ccf70c55b8b359aa718d652a16cca4e3e64f12942e55f1b48dd75fef914ec2461128d49a47361b09851ef4a89c4262d4446e9f61b';
    const tableAddr = '0x00112233445566778899aabbccddeeff00112233';
    const handId = 34;
    const signerAddr = '0x2222222222222222222222222222222222222222';
    const leave = new Receipt(tableAddr).leave(handId, signerAddr);
    console.dir(leave);
    // test signing
    expect(leave.sign(PRIV)).to.eql(leaveReceipt);
    expect(leave.signToHex(PRIV)).to.eql(leaveHex);
    // test parse
    expect(Receipt.parseToHex(leaveReceipt)).to.eql(leaveHex);
    expect(Receipt.parse(leaveReceipt)).to.eql({ handId, signerAddr });
    done();
  });

  it('should fail with invalid sig.', (done) => {
    const leaveReceipt = 'AYYP.AAAAIt3u/wARIjMiIjIiIiIiIiIiIiIiIiIiIiIiIg==.rRkcm8/3Spamtr20PM9wxVuLNZqnGNZSoWzKTj5k8SlC5V8bSN11/vkU7CRhEo1JpHNhsJhR70qJxCYtREbp9hs=';
    // test parse
    try {
      Receipt.parseToHex(leaveReceipt);
    } catch (e) {
      done();
    }
    throw new Error('should have thrown');
  });
});
