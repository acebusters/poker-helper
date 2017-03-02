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

    let nextPos = this.nextActivePlayer(hand.lineup, hand.dealer + 1);
    if (hand.lineup.length == 2)
      nextPos = hand.dealer;
    
    if (checkFound) {
      var breakCond = hand.lineup.length;
      let prev = -1;

      while (breakCond > 0) {
        var lastAction = (hand.lineup[nextPos].last) ? this.rc.get(hand.lineup[nextPos].last).abi[0].name : "";
        if (lastAction.indexOf('check') > -1 && lastAction == checkFound) {
          prev = nextPos;
          nextPos = this.nextActivePlayer(hand.lineup, nextPos + 1);
          breakCond--;
        } else {
          breakCond = 0;
        }
        let hpd = this.hasPassedDealer(prev, nextPos, hand.dealer);
        if (hpd)
          breakCond = 0; 
      }
    }

    return this.nextActivePlayer(hand.lineup, nextPos);
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


PokerHelper.prototype.hasPassedDealer = function(prev, next, dealer) {
  if (prev == -1)
    return false;
  if (next > dealer && prev > dealer && prev < next)
    return false;
  if (next < prev && prev <= dealer)
    return true;
  if (prev >= 0 && prev <= dealer && next > dealer)
    return true; 
  if (next > dealer && prev > dealer && prev > next)
    return true;
}

PokerHelper.prototype.nextActivePlayer = function(lineup, playerPos) {
  let newPos = playerPos % lineup.length;
  for (var i = newPos; i < lineup.length + newPos; i++) {
    var pos = i % lineup.length;
    var lastAction = (lineup[pos].last) ? this.rc.get(lineup[pos].last).abi[0].name : "";
    var address = lineup[pos].address;
    if (lastAction != 'fold'
      && lastAction != 'show'
      && lastAction != 'sitOut'
      && address !== '0x0000000000000000000000000000000000000000') {
      newPos = pos;
      break;
    }
  }
  return newPos;
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
  var maxPos;
  for (var i = 0; i < lineup.length; i++) {
    let pos = (i + dealer) % lineup.length;
    if (!lineup[pos].last)
      continue;
    var amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (amount >= max) { 
      max = amount;
      maxPos = pos;
    } 
  }
  for (i = maxPos; i < lineup.length + maxPos;i++) {
    let pos = i % lineup.length;
    pos = this.nextActivePlayer(lineup, pos+1);
    var amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (amount == max) {
      maxPos = pos; 
    } else {
      break;
    }
  }
  return { amount: max, pos: maxPos };
}

PokerHelper.prototype.activePlayersLeft = function(hand) {
  let activeCount = 0;
  for (let i = hand.dealer; i < hand.lineup.length + hand.dealer; i++) {
    let pos = i % hand.lineup.length;
    let lastAction = (hand.lineup[pos].last) ? this.rc.get(hand.lineup[pos].last).abi[0].name : "";
    var address = hand.lineup[pos].address;
    if (lastAction != 'fold'
      && lastAction != 'show'
      && lastAction != 'sitOut'
      && address !== '0x0000000000000000000000000000000000000000') {
      activeCount++;
    }
  }
  return activeCount;
}

// find out if it is time to start next hand
PokerHelper.prototype.checkForNextHand = function(hand) {
  let activePlayerCount = this.activePlayersLeft(hand);
  if (hand.state == 'showdown') {
    return (activePlayerCount == 0);
  } else {
    return (activePlayerCount <= 1);
  }
}

PokerHelper.prototype.inLineup = function(signer, lineup) {
  for (var i = 0; i < lineup.length; i++)
    if (lineup[i].address == signer)
      return i;
  return -1;
}

PokerHelper.prototype.allDone = function(lineup, dealer, handState, max) {
  let pos, done = true, foundPlayer = 0, foundCheck = 0, checkType;
  let offset = (handState == 'dealing') ? 2 : 0;
  for (let i = 0; i < lineup.length; i++) {
    pos = (i + dealer + offset) % lineup.length;
    if (!lineup[pos].last) {
      return false;
    }
    
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
  if (foundCheck > 0 && (foundCheck < foundPlayer || checkType.toLowerCase().indexOf(handState) < 0))
    return false;
  return done;
}

PokerHelper.prototype.calculatePotsize = function(lineup) {
  let potSize = 0;
  for (var i = 0; i < lineup.length; i++) {
    let receipt = (lineup[i].last) ? this.rc.get(lineup[i].last) : undefined;
    potSize += (receipt) ? receipt.values[1] : 0;
  }
  return potSize;
}

PokerHelper.prototype.getMyPos = function(lineup, address) {
  let myPos;
  for (var i = 0; i < lineup.length; i++) {
    if (lineup[i].address == address) {
      myPos = i;
    }
  }
  return myPos;
}

PokerHelper.prototype.getMyMaxBet = function(lineup, address) {
  if (!lineup || !address) return -1;
  let myPos = this.getMyPos(lineup, address);
  if (myPos == undefined) return -1;
  let receipt = (lineup[myPos].last) ? this.rc.get(lineup[myPos].last) : undefined;
  return (receipt) ? receipt.values[1] : -1;
}

module.exports = PokerHelper;