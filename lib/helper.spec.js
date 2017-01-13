/**
 * Created by helge on 06.01.17.
 */
var expect = require('chai').expect;
var sinon = require('sinon');
var PokerHelper = require( './helper');
require('chai').use(require('sinon-chai'));
const EWT = require('ethereum-web-token');
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

var hand0 =  {
    state: "dealing",
    lineup: [],
    dealer: 1
}

describe('whosTurn in Dealing', () => {
    it('should identify pos of big blind' , function(done) {
        var lineup = [{
            address: '0x1'
        }, {
            address: '0x1'
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }];
        hand0.lineup = lineup;
        expect(pokerHelper.whosTurn(hand0)).to.eql(0);
        done();
    });

    it('should identify pos of button' , function(done) {
        var lineup = [{
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
            address: '0x1'
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }];
        hand0.lineup = lineup;
        expect(pokerHelper.whosTurn(hand0)).to.eql(1);
        done();
    });
});

var hand1 =  {
    state: "preflop",
    lineup: [],
    dealer: 0
}

var hand2 =  {
    state: "preflop",
    lineup: [],
    dealer: 1
}

describe('whosTurn in PreFlop', () => {
    it('should identify pos of small blind' , function(done) {
        var lineup = [{
            address: '0x1'
        }, {
            address: '0x2'
        }];
        hand1.lineup = lineup;
        expect(pokerHelper.whosTurn(hand1)).to.eql(0);
        done();
    });

    it('should identify pos of small blind with array wrap around' , function(done) {
        var lineup = [{
            address: '0x1'
        }, {
            address: '0x2'
        }];
        hand2.lineup = lineup;
        expect(pokerHelper.whosTurn(hand2)).to.eql(1);
        done();
    });

    it('should identify pos of big blind when state dealing' , function(done) {
        var lineup = [{
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }, {
            address: '0x2'
        }];
        hand1.lineup = lineup;
        expect(pokerHelper.whosTurn(hand1)).to.eql(1);
        done();
    });

    it('should identify pos of big blind when state dealing with array wrap around' , function(done) {
        var lineup = [{
            address: '0x1'
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }];
        hand2.lineup = lineup;
        expect(pokerHelper.whosTurn(hand2)).to.eql(0);
        done();
    });

    it('should identify player UTG+1 as player to act' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
        }, {
            address: '0x1'
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }];
        hand2.lineup = lineup;
        expect(pokerHelper.whosTurn(hand2)).to.eql(1);
        done();
    });

    it('should identify next player when there are sitouts' , function(done) {
        var lineup = [{
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
        }, {
            address: '0x1'
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)
        },{
            address: '0x3',
            last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P3_KEY)
        },{
            address: '0x4',
            last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
        }];
        hand1.lineup = lineup;
        expect(pokerHelper.whosTurn(hand1)).to.eql(0);
        done();
    });
});

// beyond dealing

var hand3 =  {
    state: "flop",
    lineup: [],
    dealer: 1
}

var hand4 =  {
    state: "flop",
    lineup: [],
    dealer: 0
}

describe('whosTurn in Flop', () => {
    it('should identify player UTG+1 as player to act on the flop' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 100).sign(P1_KEY)

        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 100).sign(P3_KEY)
        }];
        hand2.lineup = lineup;
        expect(pokerHelper.whosTurn(hand2)).to.equal(2);
        done();
    });

    it('should identify player Dealer(1) as player to act on the flop' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 100).sign(P2_KEY)
        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)
        }];
        hand3.lineup = lineup;
        expect(pokerHelper.whosTurn(hand3)).to.equal(1);
        done();
    });

    it('should identify player UTG+1 as player to act on the flop' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 50).sign(P1_KEY)

        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 50).sign(P2_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 50).sign(P3_KEY)
        }];
        hand2.lineup = lineup;
        expect(pokerHelper.whosTurn(hand2)).to.equal(2);
        done();
    });

    it('should identify player after last check as to act on the flop' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 10).sign(P1_KEY)

        }, {
            address: '0x1',
            last: new EWT(ABI_CHECK_FLOP).checkFlop(1, 10).sign(P2_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
        }];
        hand4.lineup = lineup;
        expect(pokerHelper.whosTurn(hand4)).to.equal(2);
        done();
    });

    //all even, but no check?
    it('all even, but no check' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)

        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 10).sign(P3_KEY)
        }];
        hand4.lineup = lineup;
        expect(pokerHelper.whosTurn(hand4)).to.equal(1);
        done();
    });

    it('last to act is fold' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_FOLD).fold(1, 10).sign(P1_KEY)

        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 20).sign(P2_KEY)
        },{
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 20).sign(P3_KEY)
        }];
        hand4.lineup = lineup;
        expect(pokerHelper.whosTurn(hand4)).to.equal(1);
        done();
    });

    it('uncalled bet' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_FOLD).fold(1, 5).sign(P1_KEY)
        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 20).sign(P2_KEY)
        },{
            address: '0x4',
            last: new EWT(ABI_FOLD).fold(1, 5).sign(P3_KEY)
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 10).sign(P4_KEY)
        }];
        hand4.lineup = lineup;
        expect(pokerHelper.whosTurn(hand4)).to.equal(3);
        done();
    });
});


var hand5 =  {
    state: "turn",
    lineup: [],
    dealer: 0
}

describe('whosTurn in River', () => {
    it('premature caller' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_BET).bet(1, 20).sign(P4_KEY)
        }, {
            address: '0x1',
            last: new EWT(ABI_BET).bet(1, 40).sign(P4_KEY)
        },{
            address: '0x4',
            last: new EWT(ABI_BET).bet(1, 40).sign(P4_KEY)
        }, {
            address: '0x2',
            last: new EWT(ABI_BET).bet(1, 40).sign(P4_KEY)
        }];
        hand4.lineup = lineup;
        expect(pokerHelper.whosTurn(hand4)).to.equal(0);
        done();
    });
});

var hand5 =  {
    state: "showdown",
    lineup: [],
    dealer: 0
}

describe('check for next hand', () => {
    it('should not advance to next hand because not all active players have shown their hand' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_SHOW).show(1, 0).sign(P4_KEY)
        }, {
            address: '0x1',
            last: new EWT(ABI_SHOW).show(1, 0).sign(P4_KEY)
        },{
            address: '0x4',
            last: new EWT(ABI_BET).bet(1, 40).sign(P4_KEY)
        },{
            address: '0x5',
            last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
        }];
        hand5.lineup = lineup;
        expect(pokerHelper.checkForNextRound(hand5)).to.equal(false);
        done();
    });

    it('should advance to next hand because all active players have shown their hand' , function(done) {
        var lineup = [{
            address: '0x3',
            last: new EWT(ABI_SHOW).show(1, 0).sign(P4_KEY)
        }, {
            address: '0x1',
            last: new EWT(ABI_FOLD).fold(1, 0).sign(P4_KEY)
        },{
            address: '0x3',
            last: new EWT(ABI_SHOW).show(1, 0).sign(P4_KEY)
        }, {
            address: '0x4',
            last: new EWT(ABI_SIT_OUT).sitOut(1, 0).sign(P4_KEY)
        }];
        hand5.lineup = lineup;
        expect(pokerHelper.checkForNextRound(hand5)).to.equal(true);
        done();
    });
});