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


describe('isHandComplete() ', () => {
  it('should reject if not all active players have shown their hand.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(0)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(false);
  });

  it('should return true with sitout.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).checkRiver(1, bignum(40)).sign(P2_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if all active players have shown their hand.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(1)).sign(P4_PRIV),
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if player timed out.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });
  
  it('should allow next hand if player all-in and player fold.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        sitout: 'allin',
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should prevent next hand if all-in player didn\'t show.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        sitout: 'allin',
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(false);
  });

  it('should allow next hand if all but one player have folded.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow to find hand complete with 1 player left', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).sitOut(3, bignum(50)).sign(P1_PRIV),
      sitout: 1,
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(3, bignum(100)).sign(P3_PRIV),
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isHandComplete(lineup, 0, 'preflop')).to.equal(true);
  });

  it('should allow next hand if current hand is not started and if all but one player have folded or are on sitOut.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(40)).sign(P3_PRIV),
        sitout: 1,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P4_PRIV),
      }, {
        address: P_EMPTY,
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if current hand is started if all but one player have folded or are on sitOut.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).sitOut(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P4_PRIV),
      }, {
        address: P_EMPTY,
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if all but one player have folded or are timed out.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(40)).sign(P3_PRIV),
        sitout: 1,
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if player folded in showdown.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P2_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(30)).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
          // last: new Receipt(TABLE_ADDR).bet(1, bignum(40)).sign(P3_PRIV)
          // ↑ why is this not complet?
        last: new Receipt(TABLE_ADDR).show(1, bignum(40)).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new Receipt(TABLE_ADDR).fold(1, bignum(40)).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should return false in waiting with no receipts.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
    }];
    expect(pokerHelper.isHandComplete(lineup, 1, 'waiting')).to.equal(false);
  });
});

describe('isBettingDone() ', () => {
  it('should keep waiting state till SB payed.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'waiting', bignum(50))).to.equal(false);
  });

  it('should proceed to dealing state when SB payed.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'waiting', bignum(50))).to.equal(true);
  });

  it('should not proceed to next betting round in flop with checkPre receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(50)).sign(P1_PRIV), // BB
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV), // BU
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(50)).sign(P2_PRIV), // SB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'flop', bignum(50))).to.equal(false);
  });

  it('should proceed to preflop state when 0R payed.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'dealing', bignum(50))).to.equal(true);
  });

  it('should proceed to next round when bb folded.', () => {
    const lineup = [{
      address: P1_ADDR, // BU
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR, // SB
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR, // BB
      last: new Receipt(TABLE_ADDR).fold(1, bignum(200)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(200))).to.equal(true);
  });

  it('should proceed to showdown when second to last called-in.', () => {
    const lineup = [{
      address: P1_ADDR, // BU
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1200)).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR, // SB
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1000)).sign(P2_PRIV),
      sitout: 'allin',
    }, {
      address: P3_ADDR, // BB
      last: new Receipt(TABLE_ADDR).fold(1, bignum(200)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'flop', bignum(200))).to.equal(true);
  });

  it('should not proceed to next round when all-in needs to be called.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P3_PRIV), // BB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', bignum(50))).to.equal(false);
  });

  it('should not proceed to next round when all-in needs to be called from the bb.', () => {
    const lineup = [{
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P3_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P1_PRIV), // BB
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV), // BU
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isBettingDone(lineup, 3, 'preflop', bignum(50))).to.equal(false);
  });

  it('should proceed to next round when both players all-in.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P2_ADDR,
      sitout: 1,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P3_PRIV), // BB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', bignum(50))).to.equal(true);
  });

  it('should proceed to next round when all-in called by all.', () => {
    const dealer = 3;
    const bbAmount = bignum(100);
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(800)).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1200)).sign(P2_PRIV), // BB
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1200)).sign(P3_PRIV), // BU
    }];
    expect(pokerHelper.isBettingDone(lineup, dealer, 'preflop', bbAmount)).to.equal(true);
  });

  it('should proceed to next round when two-way all-in.', () => {
    const dealer = 3;
    const bbAmount = bignum(100);
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(800)).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1100)).sign(P2_PRIV), // BB
      sitout: 'allin',
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1200)).sign(P3_PRIV), // BU
    }];
    expect(pokerHelper.isBettingDone(lineup, dealer, 'preflop', bbAmount)).to.equal(true);
  });

  it('should proceed to next round when multi-way all-in.', () => {
    const dealer = 3;
    const bbAmount = bignum(100);
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(800)).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1100)).sign(P2_PRIV), // BB
      sitout: 'allin',
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1200)).sign(P3_PRIV), // BU
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, dealer, 'preflop', bbAmount)).to.equal(true);
  });

  it('should proceed to showdown when calling-in heads up.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P1_PRIV), // SB
    }, {
      address: P2_ADDR,
      sitout: 1,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P3_PRIV), // BB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', bignum(50))).to.equal(true);
  });

  it('should not proceed to next round when mutliway all-in in needs to be called.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(50)).sign(P1_PRIV), // BB
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(1800)).sign(P2_PRIV), // BU
      sitout: 'allin',
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(2200)).sign(P3_PRIV), // SB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'flop', bignum(50))).to.equal(false);
  });

  it('should proceed to flop whenn bb checked.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      sitout: 1,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(200))).to.equal(true);
  });

  it('should keep preflop until BB.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(200))).to.equal(false);
  });

  it('should return true when bb checkPre with other pre checker.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(200)).sign(P1_PRIV), // BB
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P3_PRIV), // BU
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(200)).sign(P2_PRIV), // SB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'preflop', bignum(200))).to.equal(true);
  });

  it('should proceed to next round with folded player.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkPre(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P3_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isBettingDone(lineup, 2, 'preflop', bignum(200))).to.equal(true);
  });

  it('should complete preflop when bb timeoutet', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(100))).to.equal(true);
  });

  it('should take sitouts into account.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(100))).to.equal(true);
  });

  it('should take empty seats into account.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(200)).sign(P2_PRIV),
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', bignum(100))).to.equal(true);
  });

  it('should wait for all to post 0 receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(50)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(100)).sign(P3_PRIV),
    }, {
      address: P4_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(0)).sign(P4_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'dealing')).to.equal(false);
  });

  it('should wait for all to check.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(150)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(150)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).bet(1, bignum(150)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'flop')).to.equal(false);
  });

  it('should allow to check multiple rounds.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(150)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(150)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(false);
  });

  it('should allow to check multiple rounds, one left.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(150)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(false);
  });

  it('should allow to check multiple rounds, all done.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).checkTurn(1, bignum(150)).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(true);
  });

  it('should not advance to next state if checks don\'t match state.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(10)).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new Receipt(TABLE_ADDR).fold(1, bignum(5)).sign(P3_PRIV),
    }, {
      address: P4_ADDR,
      last: new Receipt(TABLE_ADDR).checkFlop(1, bignum(10)).sign(P4_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn')).to.equal(false);
  });
});
