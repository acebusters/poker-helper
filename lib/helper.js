/**
 * Created by helge on 06.01.17.
 */

const EWT = require('ethereum-web-token');

const ABI_BET = [{name: 'bet', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_ALL_IN = [{name: 'allIn', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_FOLD = [{name: 'fold', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_SIT_OUT = [{name: 'sitOut', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

const ABI_CHECK_FLOP = [{name: 'checkFlop', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_CHECK_TURN = [{name: 'checkTurn', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_CHECK_RIVER = [{name: 'checkRiver', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

const ABI_SHOW = [{name: 'show', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];
const ABI_MUCK = [{name: 'muck', type: 'function', inputs: [{type: 'uint'}, {type: 'uint'}]}];

function PokerHelper() {

}


PokerHelper.prototype.isMyTurn = function(hand, myPos) {
    return this.whosTurn(hand) == myPos;
}

/**
 *
 * @param hand
 * @returns {number}
 */
PokerHelper.prototype.whosTurn = function(hand) {

    var allEven = this.areAllEven(hand.lineup);

    if (allEven) {
        //if at least one check receipt exists?
        for (var i = 0; i < hand.lineup.length; i++) {
            var lastAction = (hand.lineup[i].last) ? EWT.parse(hand.lineup[i].last).abi[0].name : "";
            if (lastAction.indexOf('check') > -1)
                return this.nextActivePlayer(hand.lineup, i + 1);
        }
        if (hand.lineup.length == 2)
            return hand.dealer;
        let startPos = hand.dealer + 1 % hand.lineup.length;
        let nextPos = this.nextActivePlayer(hand.lineup, startPos);
        return nextPos;

    } else {
        let startPos = this.findMaxBet(hand.lineup, hand.dealer).pos + 1;
        let nextPos = this.nextActivePlayer(hand.lineup, startPos);
        return nextPos;
    }
    return -1;
}

PokerHelper.prototype.nextActivePlayer = function(lineup, playerPos) {
    let newPos = playerPos;
    for (var i = newPos; i < lineup.length + newPos; i++) {
        var pos = i % lineup.length;
        var lastAction = (lineup[pos].last) ? EWT.parse(lineup[pos].last).abi[0].name : "";
        if (lastAction != 'fold'
            && lastAction != 'sitOut') {
            newPos = pos;
            break;
        }
    }
    return newPos % lineup.length;
}

PokerHelper.prototype.areAllEven = function(players) {
    var prev;
    for (var i = 0; i < players.length; i++) {
        var lastAction = (players[i].last) ? EWT.parse(players[i].last).abi[0].name : "";
        if (lastAction != 'fold' && lastAction != 'sitOut') {
            var amount = (players[i].last) ? EWT.parse(players[i].last).values[1] : 0;
            if (prev !== undefined && prev != amount)
                return false;
            prev = amount;
        }
    }
    return true;
}

/**
 *
 * @param lineup -> table lineup
 * @param myPos -> our position at the table
 * @param prevPos -> the player to our left
 * @returns {*} -> the receipt of the active player next to us
 */
 
PokerHelper.prototype.findPrevPlayer = function(lineup, myPos, prevPos) {
    let prevPlayerReceipt;
    let prevIndex = (prevPos == 0) ? lineup.length - 1 : prevPos - 1;
    let prev = lineup[prevIndex];
    if (prev && prev.last) {
        prevPlayerReceipt = EWT.parse(prev.last);
        if (prevPlayerReceipt.abi[0].name === 'fold' || prevPlayerReceipt.abi[0].name === 'sitOut') {
            if (prevPos - 1 == myPos)
                return null;
            return this.findPrevPlayer(lineup, myPos, prevPos - 1);
        }
    }
    return prevPlayerReceipt;
}

/**
 *
 * @param lineup
 * @param dealer (number between 0 and lineup.length) the pos the dealer button is at on the table
 * @returns {{amount: number, pos: *}}
 */
PokerHelper.prototype.findMaxBet = function(lineup, dealer) {
    var max = 0;
    var pos;
    for (var i = 0; i < lineup.length; i++) {
        if (!lineup[(i + dealer) % lineup.length].last)
            continue;
        var amount = (lineup[(i + dealer) % lineup.length].last) ? EWT.parse(lineup[(i + dealer) % lineup.length].last).values[1] : 0;
        if (amount >= max) { 
            max = amount;
            pos = (i + dealer) % lineup.length;``
        }
    }
    return { amount: max, pos } ;
}

PokerHelper.prototype.checkForNextRound = function(hand) {
    // find out if it is time to start next hand
    // only call in handstate showdown
    if (hand.state != 'showdown') { return false };
    let players = hand.lineup;
    for (var i = 0; i < players.length; i++) {
        var lastAction = (players[i].last) ? EWT.parse(players[i].last).abi[0].name : "";
        if (lastAction != 'fold' && lastAction != 'sitOut' && lastAction != 'show' ) {
            return false;
        }
    }
    return true;
}

module.exports = PokerHelper;