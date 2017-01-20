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


describe('whosTurn in Dealing', () => {

  it('should identify pos of big blind' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    };
    expect(pokerHelper.whosTurn(hand)).to.eql(0);
    done();
  });

  it('should identify pos of button' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should identify right player when not all 0 receipts posted' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P1_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });

  it('should identify right player when not all 0 receipts posted with sitout' , (done) => {
    let hand = {
      state: 'dealing',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
        }, {
          address: P2_ADDR
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 100).sign(P4_KEY)
      },{
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
      }],
      dealer: 1
    }
    expect(pokerHelper.whosTurn(hand)).to.eql(1);
    done();
  });
});

describe('whosTurn in PreFlop', () => {

  it('should identify pos of small blind' , function(done) {
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

  it('should identify pos of small blind with array wrap around' , function(done) {
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

  it('should identify pos of big blind when state dealing' , function(done) {
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

  it('should identify pos of big blind when state dealing with array wrap around' , function(done) {
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

  it('should identify player UTG+1 as player to act' , function(done) {
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

  it('should identify next player when there are sitouts' , function(done) {
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
});

describe('whosTurn in Flop', () => {

  it('should identify player UTG+1 as player to act on the flop' , (done) => {
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

  it('should identify player in BB to act on the flop' , (done) => {
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

  it('should identify player Dealer(1) as player to act on the flop' , (done) => {
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

  it('should identify player UTG+1 as player to act on the flop', (done) => {
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

  it('should identify player after last check as to act on the flop' , (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(2);
    done();
  });

  it('identify the right player if players have folded' , function(done) {
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

  //all even, but no check?
  it('all even, but no check', (done) => {
    let hand = {
      state: 'flop',
      lineup: [{
          address: P1_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P1_KEY)
        }, {
          address: P2_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P2_KEY)
        }, {
          address: P3_ADDR,
          last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.whosTurn(hand)).to.equal(1);
    done();
  });

  it('last to act is fold', (done) => {
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

  it('uncalled bet', (done) => {
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

});

describe('whosTurn in turn', () => { 
  it('should dstinguish between check rounds', (done) => {
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


describe('whosTurn in River', () => {

  it('expect sb to act on the river', (done) => {
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

  it('expect sb to act on the river with wrap around', (done) => {
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

describe('check for next hand', () => {

  it('should not advance to next hand because not all active players have shown their hand', (done) => {
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

  it('should advance to next hand because all active players have shown their hand', (done) => {
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

  it('should advance to next because all but one player have folded', (done) => {
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

  it('should advance to next because all but one player have folded or are on sitOut', (done) => {
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
          last: new EWT(ABI_SIT_OUT).sitOut(1, 40).sign(P3_KEY)
        }, {
          address: P4_ADDR,
          last: new EWT(ABI_BET).bet(1, 0).sign(P4_KEY)
      }],
      dealer: 0
    };
    expect(pokerHelper.checkForNextHand(hand)).to.equal(true);
    done();
  });
});

describe('allDone', () => {

  it('should take sitouts into account', (done) => {
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
    expect(pokerHelper.allDone(lineup, 0, 'preflop', 200)).to.equal(true);
    done();
  });

  it('should wait for all to 0 receipt', (done) => {
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

  it('should wait for all to check', (done) => {
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

  it('should allow to check multiple rounds', (done) => {
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

  it('should allow to check multiple rounds, one left', (done) => {
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

  it('should allow to check multiple rounds, all done', (done) => {
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

});

describe('calculatePotsize', () => {

  it('should calculate basic pot size', (done) => {
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

describe('getMyPos', () => {

  it('should get my position', (done) => {
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

  it('should return undefined if not there', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyPos(lineup, P2_ADDR)).to.equal(undefined);
    done();
  });

});

describe('getMyMaxBet', () => {

  it('should get my bet amount', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(200);
    done();
  });

  it('should return -1 with no lineup', (done) => {
    expect(pokerHelper.getMyMaxBet(undefined, P1_ADDR)).to.equal(-1);
    done();
  });

  it('should return -1 if not in lineup', (done) => {
    let lineup = [{
        address: P1_ADDR,
        last: new EWT(ABI_BET).bet(1, 200).sign(P1_KEY)
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P2_ADDR)).to.equal(-1);
    done();
  });

  it('should return -1 if no receipt', (done) => {
    let lineup = [{
        address: P1_ADDR
    }];
    expect(pokerHelper.getMyMaxBet(lineup, P1_ADDR)).to.equal(-1);
    done();
  });

});