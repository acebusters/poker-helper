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
    expect(pokerHelper.isBettingDone(lineup, 0, 'waiting', 50)).to.equal(false);
  });

  it('should proceed to dealing state when SB payed.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 50).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'waiting', 50)).to.equal(true);
  });

  it('should not proceed to next betting round in flop with checkPre receipt.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 50).sign(P1_PRIV), // BB
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV), // BU
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 50).sign(P2_PRIV), // SB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'flop', 50)).to.equal(false);
  });

  it('should proceed to preflop state when 0R payed.', () => {
    const lineup = [{
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 0).sign(P1_PRIV),
    }, {
      address: P_EMPTY,
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 50).sign(P2_PRIV),
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 100).sign(P3_PRIV),
    }];
    expect(pokerHelper.isBettingDone(lineup, 0, 'dealing', 50)).to.equal(true);
  });

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

  it('should not proceed to next round when all-in needs to be called.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P3_PRIV), // BB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', 50)).to.equal(false);
  });

  it('should proceed to next round when both players all-in.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P1_PRIV), // SB
      sitout: 'allin',
    }, {
      address: P2_ADDR,
      sitout: 1,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P3_PRIV), // BB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', 50)).to.equal(true);
  });

  it('should proceed to showdown when calling-in heads up.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P1_PRIV), // SB
    }, {
      address: P2_ADDR,
      sitout: 1,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P3_PRIV), // BB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'turn', 50)).to.equal(true);
  });

  it('should not proceed to next round when mutliway all-in in needs to be called.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 50).sign(P1_PRIV), // BB
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_BET).bet(1, 1800).sign(P2_PRIV), // BU
      sitout: 'allin',
    }, {
      address: P_EMPTY,
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 2200).sign(P3_PRIV), // SB
      sitout: 'allin',
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'flop', 50)).to.equal(false);
  });

  it('should proceed to flop whenn bb checked.', () => {
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

  it('should return true when bb checkPre with other pre checker.', () => {
    const lineup = [{
      address: P_EMPTY,
    }, {
      address: P1_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P1_PRIV), // BB
    }, {
      address: P3_ADDR,
      last: new EWT(ABI_BET).bet(1, 200).sign(P3_PRIV), // BU
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_PRIV), // SB
    }];
    expect(pokerHelper.isBettingDone(lineup, 1, 'preflop', 200)).to.equal(true);
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

  it('should complete preflop when bb timeoutet', () => {
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
      last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P1_PRIV),
    }, {
      address: P2_ADDR,
      last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P2_PRIV),
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
