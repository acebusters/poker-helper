import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import Solver from 'pokersolver';
import EWT from 'ethereum-web-token';
import PokerHelper from './helper';

chai.use(sinonChai);
const pokerHelper = new PokerHelper();

const ABI_BET = [{ name: 'bet', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_FOLD = [{ name: 'fold', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_SIT_OUT = [{ name: 'sitOut', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];

const ABI_CHECK_PRE = [{ name: 'checkPre', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_CHECK_FLOP = [{ name: 'checkFlop', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_CHECK_TURN = [{ name: 'checkTurn', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];
const ABI_CHECK_RIVER = [{ name: 'checkRiver', type: 'function', inputs: [{ type: 'uint' }, { type: 'uint' }] }];

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
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });

  it('should find BB when SB completes preflop.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }, {
        address: P3_ADDR, // BB
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.equal(2);
  });

  it('should find BB when SB completes preflop headsup.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P2_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }, {
        address: P3_ADDR, // BB
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.equal(2);
  });

  it('should throw error with undefined BB.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P2_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR, // BB
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn.bind(pokerHelper, hand.lineup, hand.dealer, hand.state, undefined)).to.throw('BB amount cannot be undefined');
  });

  it('should throw Error if heads up and one sitout.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
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
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P1_PRIV),
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
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P1_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 0).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }, {
        address: P4_ADDR, // BB
        last: new EWT(ABI_BET).bet(1, 100).sign(P4_PRIV),
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
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(3);
  });

  it('should find turn when not all 0 receipts posted with sitout.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_PRIV),
      }, {
        address: P2_ADDR,
      }, {
        address: P3_ADDR,
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P4_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P4_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P4_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.eql(1);
  });

  // TODO why is this needed?
  it('should identify pos of BB when state dealing with array wrap around.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(0);
  });
});

describe('whosTurn() in state PreFlop ', () => {
  it('should find turn of SB.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.eql(0);
  });

  it('should find turn of SB with array wrap around.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR, // BB
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P2_ADDR, // SB
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.eql(2);
  });

  it('should find turn of UTG+1.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 25)).to.eql(1);
  });

  it('should find turn when there are sitouts.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 1).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_PRIV),
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.eql(0);
  });

  it('should find turn when there are timeouts.', () => {
    const hand = {
      state: 'preflop',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P1_ADDR,
        sitout: 1,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 1).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P4_PRIV),
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state, 50)).to.eql(0);
  });
});

describe('whosTurn() in state Flop ', () => {
  it('should find turn with button checkPre heads up.', () => {
    const hand = {
      state: 'flop',
      lineup: [{
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_PRE).checkPre(1, 100).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P_EMPTY,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
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
        last: new EWT(ABI_CHECK_PRE).checkPre(1, 100).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 0).sign(P1_PRIV),
      }, {
        address: P2_ADDR,  // SB
        last: new EWT(ABI_BET).bet(1, 150).sign(P2_PRIV),
      }, {
        address: P3_ADDR,  // BB
        last: new EWT(ABI_BET).bet(1, 102).sign(P3_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 102).sign(P4_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 50).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 100).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P3_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 10).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 10).sign(P3_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 10).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P2_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P3_PRIV),
      }, {
        address: P4_ADDR, // SB
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P4_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 10).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P3_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(1);
  });

  it('should find last active to call all in on turn.', () => {
    expect(pokerHelper.getWhosTurn([{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 500).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 1000).sign(P3_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 10).sign(P4_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 10).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 10).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(3);
  });
});

describe('whosTurn() in state Turn ', () => {
  it('should distinguish between check rounds.', () => {
    const hand = {
      state: 'turn',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 20).sign(P4_PRIV),
      }],
      dealer: 2,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });
});


describe('whosTurn() in state River ', () => {
  it('should find SB in turn after checks in Turn.', () => {
    const hand = {
      state: 'river',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 0).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P4_PRIV),
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
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 100).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 100).sign(P4_PRIV),
      }],
      dealer: 3,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.equal(0);
  });
});

describe('whosTurn() in state Showdown ', () => {
  it('should find turn of allin in showdown.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
        sitout: 1,
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
        sitout: 'allin',
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_SHOW).show(1, 100).sign(P4_PRIV),
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
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
        sitout: 'allin',
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_SHOW).show(1, 100).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.getWhosTurn(hand.lineup, hand.dealer, hand.state)).to.eql(1);
  });
});

describe('isHandComplete() ', () => {
  it('should reject if not all active players have shown their hand.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_PRIV),
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
        last: new EWT(ABI_SIT_OUT).sitOut(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_RIVER).checkRiver(1, 40).sign(P2_PRIV),
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
        last: new EWT(ABI_SHOW).show(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 1).sign(P4_PRIV),
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
        last: new EWT(ABI_SHOW).show(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        sitout: 1,
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should prevent next hand if all-in player didn\'t show.', () => {
    const hand = {
      state: 'showdown',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SHOW).show(1, 40).sign(P3_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P4_PRIV),
      }],
      dealer: 0,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });

  it('should allow next hand if all but one player have folded or are on sitOut.', () => {
    const hand = {
      state: 'dealing',
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_PRIV),
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P4_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_PRIV),
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 40).sign(P3_PRIV),
        sitout: 1,
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P4_PRIV),
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
        last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_PRIV),
      }, {
        address: P3_ADDR,
          // last: new EWT(ABI_BET).bet(1, 40).sign(P3_PRIV) <- why is this not complet?
        last: new EWT(ABI_SHOW).show(1, 40).sign(P3_PRIV),
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 40).sign(P4_PRIV),
      }],
      dealer: 1,
    };
    expect(pokerHelper.isHandComplete(hand.lineup, hand.dealer, hand.state)).to.equal(true);
  });
});

describe('isBettingDone() ', () => {
  it('should proceed to next round when bb folded.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 200).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 200)).to.equal(true);
  });

  it('should wait for bb to check preflop.', () => {
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
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 200)).to.equal(true);
  });

  it('should keep preflop until BB.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 200)).to.equal(false);
  });

  it('should proceed to next round with folded player.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isBettingDone(lineup, 2, 'preflop', 200)).to.equal(true);
  });

  it('`should complete preflop when bb timeoutet`', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 100)).to.equal(true);
  });

  it('should take sitouts into account.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
      sitout: 1,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 100)).to.equal(true);
  });

  it('should take empty seats into account.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P2_PRIV),
    }, {
      address: P_EMPTY,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'preflop', 100)).to.equal(true);
  });

  it('should wait for all to post 0 receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_BET).bet(1, 0).sign(P4_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'dealing')).to.equal(false);
  });

  it('should wait for all to check.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 150).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'flop')).to.equal(false);
  });

  it('should allow to check multiple rounds.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(false);
  });

  it('should allow to check multiple rounds, one left.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(false);
  });

  it('should allow to check multiple rounds, all done.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'turn')).to.equal(true);
  });

  it('should not advance to next state if checks don\'t match state.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_PRIV),
    }, {
      address: P4_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P4_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn')).to.equal(false);
  });
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

  it('should return -1 with no lineup.', () => {
    expect(pokerHelper.getMyMaxBet(undefined, P1_ADDR)).to.equal(-1);
  });

  it('should return -1 if not in lineup.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P1_PRIV),
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P2_ADDR)).to.equal(-1);
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
      last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_PRIV),
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

  it('should return -1 when there was no bet or raise', () => {
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
    expect(pokerHelper.findMinRaiseAmount(lineup, 2, 100)).to.equal(-1);
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

  it('should get correct description from pokersolver', () => {
    const hands = [];
    hands.push(Solver.Hand.solve(['2c', '3c', 'Td', 'Ac', '2d', '4c', '5c']));
    const wnrs = Solver.Hand.winners(hands);
    expect(wnrs[0].descr).to.eql('Straight Flush, 5c High');
  });

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
