/**
 * Created by helge on 06.01.17.
 */
import {expect} from 'chai';
import sinon from 'sinon';
import PokerHelper from './helper';
require('chai').use(require('sinon-chai'));
import EWT from 'ethereum-web-token';

var pokerHelper = new PokerHelper();

const ABI_BET = [{name: 'bet', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_ALL_IN = [{name: 'allIn', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_FOLD = [{name: 'fold', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_SIT_OUT = [{name: 'sitOut', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

const ABI_CHECK_PRE = [{name: 'checkPre', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_CHECK_FLOP = [{name: 'checkFlop', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_CHECK_TURN = [{name: 'checkTurn', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_CHECK_RIVER = [{name: 'checkRiver', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

const ABI_SHOW = [{name: 'show', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

//secretSeed: 'rural tent test net drip fatigue uncle action repeat couple lawn rival'
const P1_ADDR = '0x6d2f2c0fa568243d2def3e999a791a6df45d816e';
const P1_KEY = '0x2e39143576f97f6ecd7439a0678f330d7144110cdc58b6476687cc243d7753ca';

//secretSeed: 'engine bargain deny liberty girl wedding plug valley pig admit kiss couch'
const P2_ADDR = '0x1c5a1730ffc44ac21700bb85bf0ceefd12ce71d7';
const P2_KEY = '0x99e69145c6e7f44ba04d579faac9ef4ce5e942dc02b96a9d42b5fcb03e508729';

//secretSeed: 'stadium today then top toward crack faint similar mosquito hunt thing sibling'
const P3_ADDR = '0xdd7acad75b52bd206777a36bc41a3b65ad1c44fc';
const P3_KEY = '0x33de976dfb8bdf2dc3115801e514b902c4c913c351b6549947758a8b9d981722';

//secretSeed: 'pony section spike blossom club amused keep will gorilla assist busy tray'
const P4_ADDR = '0x0dfbfdf730c7d3612cf605e6629be369aa4eceeb';
const P4_KEY = '0xa803ed744543e69b5e4816c5fc7539427a2928e78d729c87712f180fae52fcc9';

const P_EMPTY = '0x0000000000000000000000000000000000000000';


describe('whosTurn() in state Dealing ', () => {

  it('should find BB in turn when SB.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR, // SB
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(0);
    done();
  });

  it('should return -1 if heads up and one sitout.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR
        },{
          address: P2_ADDR, // SB
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P2_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(-1);
    done();
  });

  it('should return -1 if hand state is waiting and not enough players.' , (done) => {
    let hand = {
      state: 'waiting',
      lineup: [{
          address: P1_ADDR
        },{
          address: P_EMPTY,
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(-1);
    done();
  });

  it('should return small blind if hand state is waiting.' , (done) => {
    let hand = {
      state: 'waiting',
      lineup: [{
          address: P1_ADDR
        },{
          address: P2_ADDR, // SB
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should identify pos of button.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR, // BB
          last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR, // SB
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should find turn when not all 0 receipts posted.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P1_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR, // SB
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      },{
          address: P4_ADDR, // BB
          last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should find turn with empty seats.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
        }, {
          address: P_EMPTY
        }, {
          address: P_EMPTY,
      },{
          address: P4_ADDR,
      }],
      dealer: 0
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(3);
    done();
  });

  it('should find turn when not all 0 receipts posted with sitout.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P4_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should find turn when player timeouted.' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          sitout: 'timeout'
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P4_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });
});

describe('whosTurn() in state PreFlop ', () => {

  it('should find turn of SB.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR
        }, {
          address: P2_ADDR
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(0);
    done();
  });

  it('should find turn of SB with array wrap around.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR
        }, {
          address: P2_ADDR
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  // TODO why is this needed?
  it('should find turn of BB when state dealing.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
          address: P2_ADDR
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  // TODO why is this needed?
  it('should identify pos of BB when state dealing with array wrap around.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(0);
    done();
  });

  it('should find turn of UTG+1.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should find turn when there are sitouts.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
          address: P1_ADDR
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(0);
    done();
  });

  it('should find turn when there are timeouts.' , function(done) {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
          address: P1_ADDR
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P4_KEY),
          sitout: 'timeout'
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(0);
    done();
  });
});

describe('whosTurn() in state Flop ', () => {

  it('should find turn with button checkPre heads up.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P_EMPTY
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_CHECK_PRE).checkPre(1, 100).sign(P3_KEY)
        }, {
          address: P_EMPTY
        }, {
          address: P_EMPTY
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
          address: P_EMPTY
      }],
      dealer: 4
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should find turn with button checkPre.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P_EMPTY
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_CHECK_PRE).checkPre(1, 100).sign(P3_KEY)
        }, {
          address: P_EMPTY
        }, {
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
          address: P_EMPTY
      }],
      dealer: 3
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(4);
    done();
  });

  it('should find turn of UTG+1.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(2);
    done();
  });

  it('should find turn of BB.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 0).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 150).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 102).sign(P3_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 150).sign(P3_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(2);
    done();
  });

  it('should find turn in CO to act on the flop when BB as first to act, checked the flop.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 50).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 100).sign(P2_KEY)
        }, {
          address: P_EMPTY
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
      }],
      dealer: 3
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(3);
    done();
  });

  it('should find turn of Dealer(1) after raise.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should find turn of SB.', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(2);
    done();
  });

  it('should find turn after last check.' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_KEY),
        }, {
          address: P_EMPTY,
        },{
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(3);
    done();
  });

  it('should find turn next after folded player.' , function(done) {
    var hand = {
      state: "flop",
      lineup: [{
        address: P1_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 10).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 20).sign(P2_KEY)
      },{
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P3_KEY)
      },{
        address: P4_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P4_KEY)
      }],
      dealer: 2
    }   
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should find turn when last to act folded.', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 10).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 20).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 20).sign(P3_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should find turn after uncalled bet.', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 20).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(3);
    done();
  });

  it('should not find turn of folded player.', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P4_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(3);
    done();
  });

});

describe('whosTurn() in state Turn ', () => { 
  it('should distinguish between check rounds.', (done) => {
    let hand = {
      state: 'turn',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 20).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 20).sign(P4_KEY)
      }],
      dealer: 2
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(0);
    done();
  });

});


describe('whosTurn() in state River ', () => {

  it('should find SB in turn after checks in Turn.', (done) => {
    let hand = {
      state: 'river',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 0).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('should find SB in turn after checkn in Turn (with wraparound).]', (done) => {
    let hand = {
      state: 'river',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 100).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 100).sign(P4_KEY)
      }],
      dealer: 3
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(0);
    done();
  });

});

describe('isHandCompleted() ', () => {

  it('should reject if not all active players have shown their hand.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(false);
    done();
  });

  it('should return true with sitout.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_RIVER).checkRiver(1, 40).sign(P2_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should allow next hand if all active players have shown their hand.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should allow next hand if player timed out.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          sitout: 'timeout'
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should prevent next hand if all-in player didn\'t show.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SHOW).show(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          sitout: 'allin'
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(false);
    done();
  });

  it('should allow next hand if all but one player have folded.', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should allow next hand if all but one player have folded or are on sitOut.', (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_KEY)
        }, {
          address: P_EMPTY
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
        }, {
          address: P_EMPTY
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should allow next hand if all but one player have folded or are timed out.', (done) => {
    let hand = {
      state: 'preflop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 40).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 40).sign(P3_KEY),
          sitout: 'timeout'
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

  it('should allow next hand if player folded in showdown.', (done) => {
    let hand = {
      state: 'showdown',
      lineup: [{
          address: P_EMPTY
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 30).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          // last: new EWT(ABI_BET).bet(1, 40).sign(P3_KEY) <- why is this not complet?
          last: new EWT(ABI_SHOW).show(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_FOLD).fold(1, 40).sign(P4_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });

});

describe('isBettingRoundDone() ', () => {

  it('should wait for bb to check preflop.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200, 200)).to.equal(false);
    done();
  });

  it('should wait for bb to check preflop.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        sitout: 1
    }];
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200, 200)).to.equal(true);
    done();
  });

  it('should complete preflop when BB didn\'t check', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        sitout: 1
    }];
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200, 100)).to.equal(true);
    done();
  });

  it('should take sitouts into account.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY),
        sitout: 'timeout'
    }];
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200)).to.equal(true);
    done();
  });

  it('should take empty seats into account.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P_EMPTY
    }];
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200)).to.equal(true);
    done();
  });

  P_EMPTY

  it('should wait for all to post 0 receipt.', (done) => {
    let lineup = [{
        address: P1_ADDR
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'dealing', 100)).to.equal(false);
    done();
  });

  it('should wait for all to check.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 150).sign(P3_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'flop', 150)).to.equal(false);
    done();
  });

  it('should allow to check multiple rounds.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P3_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'turn', 150)).to.equal(false);
    done();
  });

  it('should allow to check multiple rounds, one left.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 150).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'turn', 150)).to.equal(false);
    done();
  });

  it('should allow to check multiple rounds, all done.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_CHECK_TURN).checkTurn(1, 150).sign(P3_KEY)
    }];
    expect(pokerHelper.allDone(lineup, 0, 'turn', 150)).to.equal(true);
    done();
  });

  it('should not advance to next state if checks don\'t match state.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_KEY)
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P4_KEY)
    }];

    expect(pokerHelper.allDone(lineup, 1, 'turn', 10)).to.equal(false);
    done();
  });

});

describe('calculatePotsize() ', () => {

  it('should calculate basic pot size.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
    }];
    expect(pokerHelper.calculatePotsize(lineup)).to.equal(400);
    done();
  });

});

describe('myPos() ', () => {

  it('should allow to get position.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
    done();
  });

  it('should allow to get position after timout.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 0).sign(P3_KEY),
        sitout: 'timeout'
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
    done();
  });

  it('should get my position with empty seats.', (done) => {
    let lineup = [{
        address: P_EMPTY,
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(1);
    done();
  });

  it('should return -1 if seat not found.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(-1);
    done();
  });

});

describe('maxBet() ', () => {
  it('should get max bet of lineup.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
    }];
    expect(pokerHelper.findMaxBet(lineup, 0)).to.eql( { amount: 200, pos: 0 });
    done();
  });
  it('should get max bet with empty receipts.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR
    }];
    expect(pokerHelper.findMaxBet(lineup, 0)).to.eql( { amount: 200, pos: 0 });
    done();
  });
  it('should get max bet with no active players left.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_FOLD).fold(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_SHOW).show(1, 200).sign(P2_KEY)
    }];
    expect(pokerHelper.findMaxBet(lineup, 0)).to.eql( { amount: 200, pos: 0 });
    done();
  });
});

describe('myMaxBet() ', () => {

  it('should get my bet amount.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(200);
    done();
  });

  it('should return -1 with no lineup.', (done) => {
    expect(pokerHelper.getMyMaxBet(undefined, P1_ADDR)).to.equal(-1);
    done();
  });

  it('should return -1 if not in lineup.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P2_ADDR)).to.equal(-1);
    done();
  });

  it('should return -1 if no receipt.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(-1);
    done();
  });

});

describe('countActivePlayers() ', () => {

  it('should notice empty seats.', (done) => {
    let hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR
      }, {
        address: P_EMPTY
      }]
    };
    expect(pokerHelper.activePlayersLeft(hand)).to.equal(1);
    done();
  });

  it('should notice undefined seats.', (done) => {
    let hand = {
      state: 'waiting',
      lineup: [{
        address: P1_ADDR
      }, {

      }]
    };
    expect(pokerHelper.activePlayersLeft(hand)).to.equal(1);
    done();
  });

});

describe('getSbPos() ', () => {

  it('should find SB Pos heads up.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P2_ADDR
    }];
    expect(pokerHelper.getSbPos(lineup, 0)).to.equal(0);
    done();
  });

  it('should find SB Pos.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P2_ADDR
    }, {
        address: P3_ADDR
    }];
    expect(pokerHelper.getSbPos(lineup, 0)).to.equal(1);
    done();
  });

  it('should find SB Pos with empty seat.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P_EMPTY
    }, {
        address: P3_ADDR
    }];
    expect(pokerHelper.getSbPos(lineup, 0)).to.equal(0);
    done();
  });

});

describe('getBbPos() ', () => {

  it('should find BB Pos heads up.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P2_ADDR
    }];
    expect(pokerHelper.getBbPos(lineup, 0)).to.equal(1);
    done();
  });

  it('should find BB Pos.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P2_ADDR
    }, {
        address: P3_ADDR
    }];
    expect(pokerHelper.getBbPos(lineup, 0)).to.equal(2);
    done();
  });

  it('should find BB Pos with empty seat.', (done) => {
    let lineup = [{
        address: P1_ADDR
    }, {
        address: P_EMPTY
    }, {
        address: P3_ADDR
    }];
    expect(pokerHelper.getBbPos(lineup, 0)).to.equal(2);
    done();
  });

  it('should find BB pos with sitout flag.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        sitout: 1
    }];
    expect(pokerHelper.getBbPos(lineup, 0)).to.equal(1);
    done();
  });

  it('should find BB pos with sitout receipt.', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_CHECK_PRE).checkPre(1, 200).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
    }];
    expect(pokerHelper.getBbPos(lineup, 0)).to.equal(1);
    done();
  });
});

describe('findMaxRaise() ', () => {
  it('should find the max raise when there was raise', (done) => {
    let lineup = [{
        address: P_EMPTY,
        address: P1_ADDR,
      },{
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 500).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 2, 100)).to.equal(300);
    done();
  });

  it('should find the max raise when there was re-raise', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 500).sign(P2_KEY)
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 1200).sign(P3_KEY)
      }, {
        address: P4_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 3, 100)).to.equal(700);
    done();
  });

  it('should return betting amount when there was no raise', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P2_KEY)
      }, {
        address: P_EMPTY,
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 3, 100)).to.equal(100);
    done();
  });

  it('should return -1 when there was no bet or raise', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
      }, {
        address: P2_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
      }, {
        address: P3_ADDR,
        last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
    }];
    expect(pokerHelper.findMinRaiseAmount(lineup, 2, 100)).to.equal(-1);
    done();
  });
});