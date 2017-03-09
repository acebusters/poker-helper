import {expect} from 'chai';
import sinon from 'sinon';
require('chai').use(require('sinon-chai'));

import Receipt from './receipt';

const PRIV = '0x94890218f2b0d04296f30aeafd13655eba4c5bbf1770273276fee52cbe3f2cb4';

describe('receipt + signer ', () => {

  it('leave.' , (done) => {
    const leaveReceipt = 'AYYP.AAAAIt3u/wARIjMiIiIiIiIiIiIiIiIiIiIiIiIiIg==.rRkcm8/3Spamtr20PM9wxVuLNZqnGNZSoWzKTj5k8SlC5V8bSN11/vkU7CRhEo1JpHNhsJhR70qJxCYtREbp9hs=';
    const tableAddr = '0x00112233445566778899aabbccddeeff00112233';
    const handId = 34;
    const signerAddr = '0x2222222222222222222222222222222222222222';
    const leave = Receipt.leave(tableAddr, handId, signerAddr);
    expect(leave.sign(PRIV)).to.eql(leaveReceipt);
    expect(leave.signToHex(PRIV)).to.eql('0x00000022ddeeff001122332222222222222222222222222222222222222222ad191c9bcff74a96a6b6bdb43ccf70c55b8b359aa718d652a16cca4e3e64f12942e55f1b48dd75fef914ec2461128d49a47361b09851ef4a89c4262d4446e9f61b');
    const parsed = Receipt.parse(leaveReceipt);
    expect(parsed).to.eql({ handId, signerAddr });
    done();
  });
});
