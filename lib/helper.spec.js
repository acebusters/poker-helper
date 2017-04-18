import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import EWT from 'ethereum-web-token';
import PokerHelper from './helper';

chai.use(sinonChai);
const pokerHelper = new PokerHelper();

const ABI_BET = [{ name: 'bet', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_FOLD = [{ name: 'fold', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_SIT_OUT = [{ name: 'sitOut', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];

const ABI_CHECK_PRE = [{ name: 'checkPre', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_SHOW = [{ name: 'show', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];

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


describe('isBettingDone() ', () => {
  it('should return true when bb checkPre.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'preflop', 200)).to.equal(true);
  });
});

describe('isBettingDone() ', () => {
  it('should return true when bb checkPre.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P1_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P3_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'preflop', 200)).to.equal(true);
  });
});

describe('nextActivePlayer() ', () => {
  it('should be tested');
  // , () => {
  //   sinon.stub(dynamo, 'query').yields(null, { Items: [{
  //     handId: 1,
  //     dealer: 0,
  //     sb: 50,
  //     state: 'dealing',
  //     lineup: [{
  //       address: P1_ADDR
  //     },{
  //       address: P2_ADDR,
  //       last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY),
  //     },{
  //       address: P3_ADDR
  //     }],
  //     deck: deck
  //   }]});
  // });
});

describe('calculatePotsize() ', () => {
  it('should calculate basic pot size.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_PRIV),
    }];
    expect(pokerHelper.calculatePotsize(lineup)).to.equal(400);
  });
});

describe('myPos() ', () => {
  it('should allow to get position.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_PRIV),
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
  });

  it('should allow to get position after timout.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 0).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
  });

  it('should get my position with empty seats.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_PRIV),
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
  });

  it('should return -1 if seat not found.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(-1);
  });
});

describe('maxBet() ', () => {
  it('should get max bet of lineup.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }];
    expect(pokerHelper.getMaxBet(lineup, 'preflop')).to.eql({ amount: 200, pos: 1 });
  });
  it('should get max bet with empty receipts.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
    }];
    expect(pokerHelper.getMaxBet(lineup, 'flop')).to.eql({ amount: 200, pos: 0 });
  });
  it('should get max bet with no active players left.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SHOW).show(1, 200).sign(P2_PRIV),
    }];
    expect(pokerHelper.getMaxBet(lineup, 'turn')).to.eql({ amount: 200, pos: 1 });
  });
});

describe('myMaxBet() ', () => {
  it('should get my bet amount.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(200);
  });

  it('should throw with no lineup.', () => {
    expect(pokerHelper.getMyMaxBet.bind(pokerHelper, undefined, P1_ADDR)).to.throw('invalid params.');
  });

  it('should throw if not in lineup.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }];
    expect(pokerHelper.getMyMaxBet.bind(pokerHelper, lineup, P2_ADDR)).to.throw(`address ${P2_ADDR} not in lineup.`);
  });

  it('should return 0 if no receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(0);
  });
});

describe('countActivePlayers() ', () => {
  it('should notice empty seats.', () => {
    const hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P_EMPTY,
      }],
    };
    expect(pokerHelper.countActivePlayers(hand.lineup, hand.state)).to.equal(1);
  });

  it('should notice undefined seats.', () => {
    const hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR,
      }, {

      }],
    };
    expect(pokerHelper.countActivePlayers(hand.lineup, hand.state)).to.equal(1);
  });
});

describe('getSbPos() ', () => {
  it('should find SB Pos heads up.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'waiting')).to.equal(0);
  });

  it('should find SB Pos heads up when player came back from sitout.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P2_PRIV),
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'waiting')).to.equal(0);
  });

  it('should find SB Pos.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'waiting')).to.equal(1);
  });

  it('should find SB Pos with empty seat.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'waiting')).to.equal(0);
  });

  it('should find SB Pos with empty seat at showdown.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(1, 1000).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 1000).sign(P2_PRIV),
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'showdown')).to.equal(0);
  });

  it('should find SB Pos with all in at showdown.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(1, 1000).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 1000).sign(P2_PRIV),
      sitout: 'allin',
    }];
    expect(pokerHelper.getSbPos(lineup, 0, 'showdown')).to.equal(0);
  });
});

describe('getBbPos() ', () => {
  it('should find BB Pos heads up.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'dealing')).to.equal(1);
  });

  it('should find BB Pos.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'dealing')).to.equal(2);
  });

  it('should find BB Pos with empty seat.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'waiting')).to.equal(2);
  });

  it('should find BB pos with sitout flag.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      sitout: 1,
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'preflop')).to.equal(1);
  });

  it('should find BB pos with sitout receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SIT_OUT).sitOut(1, 1).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'preflop')).to.equal(1);
  });

  it('should find BB pos with preflop folder.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 0).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 100).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P3_PRIV),
    }];
    expect(pokerHelper.getBbPos(lineup, 0, 'preflop')).to.equal(2);
  });
});

describe('isHandComplete()', () => {
  it('should check if hand complete.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
    }];
    expect(pokerHelper.isHandComplete(lineup, 1, 'waiting')).to.equal(false);
  });
});

describe('findMaxRaise() ', () => {
  it('should find the max raise when there was raise', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 500).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 2, 100)).to.equal(300);
  });

  it('should find the max raise when there was re-raise', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 500).sign(P2_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 1200).sign(P3_PRIV),
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P4_PRIV),
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 3, 100)).to.equal(700);
  });

  it('should return betting amount when there was no raise', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 3, 100)).to.equal(100);
  });

  it('should throw when there was no bet or raise', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
    }];
    expect(pokerHelper.findMinRaiseAmount.bind(pokerHelper, lineup, 2, 100)).to.throw('can not find minRaiseAmount.');
  });
});

describe('calcDistribution', () => {
  it('should render pub state.', () => {
    const handId = 3;
    const dealer = 0;
    const sb = 50;
    const state = 'showdown';
    const changed = 123;
    const preMaxBet = 100;
    const flopMaxBet = 200;
    const turnMaxBet = 300;
    const riverMaxBet = 400;
    const deck = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    const show = new EWT(ABI_SHOW).show(2, 400).sign(P1_PRIV);
    const bet = new EWT(ABI_BET).bet(2, 400).sign(P2_PRIV);

    expect(pokerHelper.renderHand(handId, [{
      address: P1_ADDR,
      last: show,
    },{
      address: P2_ADDR,
      last: bet,
    }], dealer, sb, state, changed, deck, preMaxBet, flopMaxBet, turnMaxBet, riverMaxBet)).to.eql({
      handId,
      lineup: [{
        address: P1_ADDR,
        last: show,
        cards: [0, 1],
      },{
        address: P2_ADDR,
        last: bet,
      }],
      dealer,
      sb,
      cards: [20, 21, 22, 23, 24],
      state,
      changed,
      preMaxBet,
      flopMaxBet,
      turnMaxBet,
      riverMaxBet,
    });
  });
});


describe('calcDistribution', () => {
  it('should calculate distribution.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_FOLD).fold(2, 500).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(2, 1000).sign(P2_PRIV),
    }];

    expect(pokerHelper.calcDistribution(lineup, 'preflop', null, 10, P_EMPTY)).to.eql({
      [P2_ADDR]: 1485,
      [P_EMPTY]: 15,
    });
  });

  it('should calc dist with empty seats.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_FOLD).fold(2, 350).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(2, 850).sign(P2_PRIV),
      sitout: 1,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SHOW).show(2, 850).sign(P3_PRIV),
      cards: [9, 23],
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_FOLD).fold(2, 350).sign(P4_PRIV),
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.calcDistribution(lineup, 'showdown', null, 10, P_EMPTY)).to.eql({
      [P3_ADDR]: 2376,
      [P_EMPTY]: 24,
    });
  });

  it('should calc dist for showdown with split pot and odd amounts.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1050).sign(P1_PRIV),
      cards: [0, 1], // '2c', '3c'
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1050).sign(P2_PRIV),
      cards: [2, 3], // '4c', '5c'
    }];
    // board cards: 'Td', 'Jd', 'Qd', 'Kd', 'Ad'
    expect(pokerHelper.calcDistribution(lineup, 'showdown', [21, 22, 23, 24, 25], 10, P_EMPTY)).to.eql({
      [P1_ADDR]: 1039, // split pot1: 'Royal Flush'
      [P2_ADDR]: 1039, // split pot1: 'Royal Flush'
      [P_EMPTY]: 22,
    });
  });

  it('should get correct description from pokersolver');
  // TODO(ab): fix this unit test
  // , () => {
  //   const hands = [];
  //   hands.push(Solver.Hand.solve(['2c', '3c', 'Td', 'Ac', '2d', '4c', '5c']));
  //   const wnrs = Solver.Hand.winners(hands);
  //   expect(wnrs[0].descr).to.eql('Straight Flush, 5c High');
  // });

  it('should calc dist for sidepot.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P1_PRIV),
      cards: [24, 25], // 'Kd', 'Ad'
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SHOW).show(4, 400).sign(P2_PRIV),
      sitout: 'allin',
      cards: [0, 1],  // '2c', '3c'
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P3_PRIV),
      cards: [4, 5],  // '6c', '7c'
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_FOLD).fold(4, 50).sign(P4_PRIV),
    }];
    // board cards 'Td', 'Ac', '2d', '4c', '5c'
    expect(pokerHelper.calcDistribution(lineup, 'showdown', [21, 12, 13, 2, 3], 10, P_EMPTY)).to.eql({
      [P2_ADDR]: 1237, // pot1: 'Straight Flush, 5d High'
      [P_EMPTY]: 27,
      [P3_ADDR]: 1386, // pot2: 'Flush, Ac High'
    });
  });

  it('should calc dist for multiple sidepot, one takes all.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(4, 400).sign(P1_PRIV),
      sitout: 'allin',
      cards: [24, 25], // 'Kd', 'Ad'
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P2_PRIV),
      cards: [0, 1], // '2c', '3c'
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P3_PRIV),
      cards: [4, 5], // '6c', '7c'
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_SHOW).show(4, 800).sign(P4_PRIV),
      sitout: 'allin',
      cards: [6, 7], // '8c', '9c'
    }];
    // board cards: 'Td', 'Ac', '2d', '4c', '5c'
    expect(pokerHelper.calcDistribution(lineup, 'showdown', [21, 12, 13, 2, 3], 10, P_EMPTY)).to.eql({
      [P_EMPTY]: 34,   // rake 1%
      [P2_ADDR]: 3366, // pot1,2,3: 'Straight Flush, 5d High'
    });
  });

  it('should calc dist for multiple sidepot.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P1_PRIV),
      cards: [24, 25], // 'Kd', 'Ad'
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_SHOW).show(4, 400).sign(P2_PRIV),
      sitout: 'allin',
      cards: [0, 1], // '2c', '3c'
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_SHOW).show(4, 1100).sign(P3_PRIV),
      cards: [4, 5],  // '6c', '7c'
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_SHOW).show(4, 800).sign(P4_PRIV),
      sitout: 'allin',
      cards: [6, 7],  // '8c', '9c'
    }];
    // board cards: 'Td', 'Ac', '2d', '4c', '5c'
    expect(pokerHelper.calcDistribution(lineup, 'showdown', [21, 12, 13, 2, 3], 10, P_EMPTY)).to.eql({
      [P2_ADDR]: 1584, // pot1: 'Straight Flush, 5d High'
      [P_EMPTY]: 34,   // rake 1%
      [P4_ADDR]: 1188, // pot2: 'Flush, Ac High'
      [P3_ADDR]: 594,  // pot3: 'Flush, Ac High'
    });
  });
});
