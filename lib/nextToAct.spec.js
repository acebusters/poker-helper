import BigNumber from 'bignumber.js';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import PokerHelper from './helper';
import Receipt from './receipt';

chai.use(sinonChai);
const pokerHelper = new PokerHelper();

// secretSeed: 'rural tent test net drip fatigue uncle action repeat couple lawn rival'
const P1_ADDR = '0x6d2f2c0fa568243d2def3e999a791a6df45d816e';
const P1_PRIV = '0x2e39143576f97f6ecd7439a0678f330d7144110cdc58b6476687cc243d7753ca';

// secretSeed: 'engine bargain deny liberty girl wedding plug valley pig admit kiss couch'
const P2_ADDR = '0x1c5a1730ffc44ac21700bb85bf0ceefd12ce71d7';
const P2_PRIV = '0x99e69145c6e7f44ba04d579faac9ef4ce5e942dc02b96a9d42b5fcb03e508729';

// secretSeed: 'stadium today then top toward crack faint similar mosquito hunt thing sibling'
const P3_ADDR = '0xdd7acad75b52bd206777a36bc41a3b65ad1c44fc';
const P3_PRIV = '0x33de976dfb8bdf2dc3115801e514b902c4c913c351b6549947758a8b9d981722';

// secretSeed: 'pony section spike blossom club amused keep will gorilla assist busy tray'
const P4_ADDR = '0x0dfbfdf730c7d3612cf605e6629be369aa4eceeb';
const P4_PRIV = '0xa803ed744543e69b5e4816c5fc7539427a2928e78d729c87712f180fae52fcc9';

const P_EMPTY = '0x0000000000000000000000000000000000000000';

const TABLE_ADDR = '0x00112233445566778899aabbccddeeff00112233';

function bignum(num) {
  return new BigNumber(10).pow(12).mul(num);
}


describe('getWhosTurn() in state Dealing ', () => {
  it('should find BB in turn when SB.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });

  it('should throw Error if heads up and one sitout.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn.bind(pokerHelper, hand.lineup, hand.dealer, hand.state)).to.throw('no ones turn if hand complete.');
  });

  it('should throw Error if hand state is waiting and not enough players.', () => {
    const hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P_EMPTY,
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn.bind(pokerHelper, hand.lineup, hand.dealer, hand.state)).to.throw('no ones turn if hand complete.');
  });

  it('should return small blind if hand state is waiting.', () => {
    const hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P2_ADDR, // SB
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find turn of SB in state waiting headsup with sitouter.', () => {
    const hand = {
      dealer: 1,
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(0)).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
      }, {
        address: P_EMPTY,
      }],
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find turn of SB in state waiting with sitouter.', () => {
    const hand = {
      dealer: 1,
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(0)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
      }],
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(2);
  });

  it('should identify pos of button.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });

  it('should find turn when not all 0 receipts posted.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }, {
        address: P4_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });

  it('should find turn with empty seats.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P_EMPTY,
      }, {
        address: P_EMPTY,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(0);
  });

  it('should find turn when not all 0 receipts posted with sitout.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(0)).sign(P4_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P4_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });

  it('should find turn when player timeouted.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });


  // TODO why is this needed?
  it('should find turn of BB when state dealing.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.eql(1);
  });

  // TODO why is this needed?
  it('should identify pos of BB when state dealing with array wrap around.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(0);
  });
});

describe('getWhosTurn() in state PreFlop ', () => {
  it('should find BB when SB completes preflop.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }, {
        address: P3_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.equal(2);
  });

  it('should find BU when BB payed.', () => {
    const lineup = [{
      address: P1_ADDR, // BB
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      sitout: 1,
    }, {
      address: P3_ADDR, // BU
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.getWhosTurn(lineup, 2, 'preflop', bignum(100))).to.equal(2);
  });

  it('should find BB when SB called BU raise.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
      }, {
        address: P3_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.equal(2);
  });

  it('should find BB when SB completes preflop headsup.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }, {
        address: P3_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.equal(2);
  });

  it('should find SB when BU calls preflop.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR, // BU
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
    }, {
      address: P2_ADDR, // SB
      last: new Receipt(TABLE_ADDR).bet(1, bignum(25)).sign(P2_PRIV),
    }, {
      address: P3_ADDR, // BB
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
    }];
    expect(pokerHelper.getWhosTurn(lineup, 1, 'preflop', bignum(50))).to.equal(2);
  });

  it('should throw error with undefined BB.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn.bind(pokerHelper, hand.lineup, hand.dealer, hand.state, undefined)).to.throw('BB amount cannot be undefined');
  });

  it('should find turn of SB heads up.', () => {
    const dealer = 1;
    const bbAmount = bignum(100);
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
    }];

    expect(pokerHelper.getWhosTurn(lineup, dealer, 'preflop', bbAmount)).to.eql(1);
  });

  it('should find turn of SB with array wrap around.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR, // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P2_ADDR, // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.eql(2);
  });

  it('should find turn of UTG+1.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV), // BB
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P2_PRIV), // BU
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV), // SB
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(25))).to.eql(1);
  });

  it('should find correct pos with overcaller', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV), // UTG
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV), // BU
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(25)).sign(P3_PRIV), // SB
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P4_PRIV), // BB
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.eql(2);
  });

  it('should find turn when there are sitouts.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(1)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(0)).sign(P4_PRIV),
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.eql(0);
  });

  it('should find turn after all-in.', () => {
    const state = 'preflop';
    const dealer = 0;
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(4, bignum(100)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(4, bignum(800)).sign(P3_PRIV),
      sitout: 'allin',
    }, {
      address: P4_ADDR,
      sitout: 1,
    }];
    expect(pokerHelper.getWhosTurn(lineup, dealer, state, bignum(100))).to.eql(0);
  });

  it('should find turn when there are timeouts.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(1)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P4_PRIV),
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, bignum(50))).to.eql(0);
  });
});

describe('getWhosTurn() in state Flop ', () => {
  it('should find turn with button checkPre heads up.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).checkPre(1, bignum(100)).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P_EMPTY,
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }],
      dealer: 4,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find turn with button checkPre.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).checkPre(1, bignum(100)).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }],
      dealer: 3,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(4);
  });

  it('should find turn of UTG+1 in flop.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(2);
  });

  it('should find turn of BB.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(0)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,  // SB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(150)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,  // BB
        last: new Receipt(TABLE_ADDR).bet(1, bignum(102)).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(102)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(2);
  });

  it('should find turn in CO to act on the flop when BB as first to act, checked the flop.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
      }],
      dealer: 3,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(3);
  });

  it('should find turn of Dealer(1) after raise.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find turn of SB.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(2);
  });

  it('should find turn after last check.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(10)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(10)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(10)).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(3);
  });

  it('should find turn next after folded player.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,  // BB
        last: new Receipt(TABLE_ADDR).fold(1, bignum(10)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(20)).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(20)).sign(P3_PRIV),
      }, {
        address: P4_ADDR, // SB
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(20)).sign(P4_PRIV),
      }],
      dealer: 3,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find turn when last to act folded.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(10)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(20)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(20)).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find last active to call all in on turn.', () => {
    expect(pokerHelper.getWhosTurn([{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(500)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1000)).sign(P3_PRIV),
      sitout: 'allin',
    }],
    0, // dealer
    'flop')).to.equal(0);
  });

  it('should find turn after uncalled bet.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(20)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(10)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(3);
  });

  it('should not find turn of folded player.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(10)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(10)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(3);
  });
});

describe('getWhosTurn() in state Turn ', () => {
  it('should distinguish between check rounds.', () => {
    const hand = {
      state: 'turn',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(20)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(20)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(20)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(20)).sign(P4_PRIV),
      }],
      dealer: 2,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });
});


describe('getWhosTurn() in state River ', () => {
  it('should find SB in turn after checks in Turn.', () => {
    const hand = {
      state: 'river',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(0)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find SB in turn after checkn in Turn (with wraparound).]', () => {
    const hand = {
      state: 'river',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(100)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 3,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });
});

describe('getWhosTurn() in state Showdown ', () => {
  it('should find turn of allin in showdown.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
        sitout: 1,
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
        sitout: 'allin',
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 2,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(2);
  });

  it('should find last to show.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
        sitout: 'allin',
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(100)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });
});
