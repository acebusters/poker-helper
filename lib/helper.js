/**
 * Created by helge on 06.01.17.
 */

import ReceiptCache from './receiptCache';

function PokerHelper(receiptCache) {
  this.rc = (receiptCache) ? receiptCache : new ReceiptCache();
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
    var checkFound = null;

    for (var i = hand.dealer + 1; i <= (hand.dealer + 1) + hand.lineup.length; i++) {
      let pos = i % hand.lineup.length;
      var lastAction = (hand.lineup[pos].last) ? this.rc.get(hand.lineup[pos].last).abi[0].name : "";
      if (lastAction.indexOf('check') > -1) {
        checkFound = lastAction; 
        break;
      }
    }

    let nextPos = (hand.dealer + 1) % hand.lineup.length;
    if (hand.lineup.length == 2)
      nextPos = hand.dealer;
    
    if (checkFound) {
      var breakCond = hand.lineup.length;
      while (breakCond > 0) {
        var lastAction = (hand.lineup[nextPos].last) ? this.rc.get(hand.lineup[nextPos].last).abi[0].name : "";
        if (lastAction.indexOf('check') > -1 && lastAction == checkFound) {
          nextPos = this.nextActivePlayer(hand.lineup, nextPos + 1);
          breakCond--;
        } else {
          breakCond = 0;
        }
      }
    }

    return nextPos;
  } else {
    let startPos = this.findMaxBet(hand.lineup, hand.dealer).pos + 1;
    let nextPos = this.nextActivePlayer(hand.lineup, startPos);
    if (hand.state == 'dealing') {
      for (var i = 0; i < hand.lineup.length; i++) {
        let tmpPlayer = this.nextActivePlayer(hand.lineup, nextPos+i);
        if (!hand.lineup[tmpPlayer].last) {
          return tmpPlayer;
        }
      }
    }
    return nextPos;
  }
  return -1;
}

PokerHelper.prototype.nextActivePlayer = function(lineup, playerPos) {
  let newPos = playerPos;
  for (var i = newPos; i < lineup.length + newPos; i++) {
    var pos = i % lineup.length;
    var lastAction = (lineup[pos].last) ? this.rc.get(lineup[pos].last).abi[0].name : "";
    if (lastAction != 'fold'
      && lastAction != 'sitOut') {
      newPos = pos;
      break;
    }
  }
  return newPos % lineup.length;
}

PokerHelper.prototype.areAllEven = function(lineup) {
  var prev;
  for (var i = 0; i < lineup.length; i++) {
    var lastAction = (lineup[i].last) ? this.rc.get(lineup[i].last).abi[0].name : "";
    if (lastAction != 'fold' && lastAction != 'sitOut') {
      var amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
      if (prev !== undefined && prev != amount)
        return false;
      prev = amount;
    }
  }
  return true;
}

/**
 *
 * @param lineup
 * @param dealer (number between 0 and lineup.length) the pos the dealer button is at on the table
 * @returns {{amount: number, pos: *}}
 */
PokerHelper.prototype.findMaxBet = function(lineup, dealer) {
  dealer = (dealer) ? dealer : 0;
  var max = 0;
  var pos;
  for (var i = 0; i < lineup.length; i++) {
    if (!lineup[(i + dealer) % lineup.length].last)
      continue;
    var amount = (lineup[(i + dealer) % lineup.length].last) ? this.rc.get(lineup[(i + dealer) % lineup.length].last).values[1] : 0;
    if (amount >= max) { 
      max = amount;
      pos = (i + dealer) % lineup.length;
    }
  }
  return { amount: max, pos } ;
}

  // find out if it is time to start next hand
PokerHelper.prototype.checkForNextRound = function(hand) {
  // only call in handstate showdown
  if (hand.state != 'showdown') { return false };
  for (var i = 0; i < hand.lineup.length; i++) {
    let receipt = this.rc.get(hand.lineup[i].last);
    if (!receipt)
      return false
    var lastAction = receipt.abi[0].name;
    if (lastAction != 'fold' && lastAction != 'sitOut' && lastAction != 'show' ) {
      return false;
    }
  }
  return true;
}

PokerHelper.prototype.inLineup = function(signer, lineup) {
  for (var i = 0; i < lineup.length; i++)
    if (lineup[i].address == signer)
      return i;
  return -1;
}

PokerHelper.prototype.activeSeats = function(lineup) {
  var rv = 0;
  for (var i = 0; i < lineup.length; i++) {
    if (lineup[i].address && !lineup[i].sitout)
      rv++;
  }
  return rv;
}

PokerHelper.prototype.nextDealer = function(lineup, dealer) {
  dealer = (dealer) ? dealer : -1;
  for (var i = 0; i < lineup.length; i++) {
    var pos = (i + dealer + 1) % lineup.length;
    if (!lineup[pos].sitout)
      return pos;
  }
  return 0;
}

PokerHelper.prototype.allDone = function(lineup, dealer, handState, max) {
  let pos, done = true, foundPlayer = 0, foundCheck = 0, checkType;
  let offset = (handState == 'dealing') ? 2 : 0;
  for (let i = 0; i < lineup.length; i++) {
    pos = (i + dealer + offset) % lineup.length;
    if (!lineup[pos].last) {
      return false;
    }
    //console.log(i, pos, handState)
    if (handState == 'dealing')
      continue;
    var receipt = this.rc.get(lineup[pos].last);
    if (receipt.abi[0].name.indexOf('check') >= 0) {
      if (!checkType)
        checkType = receipt.abi[0].name;
      if (receipt.abi[0].name == checkType)
        foundCheck++;
    }
    if (receipt.abi[0].name != 'fold' && receipt.abi[0].name != 'sitOut') {
      if (receipt.values[1] != max)
        return false;
      foundPlayer++;
    }
  }
  if (foundCheck > 0 && foundCheck < foundPlayer)
    return false;
  return done;
}

module.exports = PokerHelper;