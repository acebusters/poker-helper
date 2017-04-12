/**
 * Created by helge on 06.01.17.
 */

import ReceiptCache from './receiptCache';
const EMPTY = '0x0000000000000000000000000000000000000000';

function PokerHelper(receiptCache) {
  this.rc = (receiptCache) ? receiptCache : new ReceiptCache();
}


PokerHelper.prototype.isMyTurn = function(hand, myPos) {
  return this.whosTurn(hand, hand.sb * 2) == myPos;
}

// normalize lineup to active players
PokerHelper.prototype.getActiveLineup = function(lineup, dealer, state) {
  const activeLineup = [];
  const startPos = this.nextActive(lineup, dealer + 1, state);
  for (let i = startPos; i < lineup.length + startPos; i += 1) {
    let pos = i % lineup.length;
    if (this.isActive(lineup[pos], state)) {
      const player = Object.assign({}, lineup[pos], { pos });
      activeLineup.push(player);
    }
  }
  return activeLineup;
} 

PokerHelper.prototype.isActive = function(player, state) {
  if (typeof player === 'undefined' || player === null) {
    return false;
  }
  // if we are at showdown and player is all in he is active
  if (player.sitout === 'allin' && state === 'showdown') {
    return true;
  }
  // check seat state
  if (player.sitout || !player.address || player.address === EMPTY) {
    return false;
  }
  // get last receipt
  const lastRec = (player.last) ? this.rc.get(player.last) : null;
  if (!lastRec || !lastRec.abi[0]) {
    return true;
  }
  const amount = lastRec.values[1];
  // check receipt type
  if (lastRec.abi[0].name === 'fold'
    || lastRec.abi[0].name === 'show'
    || player.sitout
    || (lastRec.abi[0].name === 'sitOut' && amount > 0)) {
    return false;
  }

  return true;
}

PokerHelper.prototype.evenLineup = function(lineup) {
  let prev;
  for (let i = 0; i < lineup.length; i++) {
    const amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
    if (prev !== undefined && prev != amount) {
      return false;
    }
    prev = amount;
  }
  return true;
}


PokerHelper.prototype.findLatest = function(lineup, type) {
  let latest = {};
  for (let i = 0; i < lineup.length; i++) {
    const lastAction = (lineup[i].last) ? this.rc.get(lineup[i].last).abi[0].name : '';
    if (lastAction.toLowerCase().indexOf(type) > -1) {
      latest.pos = i;
      latest.last = lastAction;
    }
  }
  return latest;
}

PokerHelper.prototype.getMaxBet = function(lineup, state) {
  let max = 0;
  let pos = -1;
  for (var i = 0; i < lineup.length; i++) {
    if (!lineup[i].last) {
      continue;
    }
    var amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
    // if we are in dealing the last 0 bet is the max bet
    if (amount >= max || (amount === 0 && state === 'dealing')) {
      max = amount;
      pos = i;
    }
  }
  return { amount: max, pos };
}

PokerHelper.prototype.whosTurn = function(hand, bb) {
  const activeLineup = this.getActiveLineup(hand.lineup, hand.dealer, hand.state);

  if (activeLineup.length === 0 || (activeLineup.length === 1 && hand.state !== 'showdown')) {
    throw new Error('no ones turn if only one or 0 player(s)');
  }

  const maxBet = this.getMaxBet(activeLineup, hand.state);
  if (!this.evenLineup(activeLineup)) {
    // if betting amounts are not even return next player of to the maxBettor
    return activeLineup[(maxBet.pos + 1) % activeLineup.length].pos;
  } else {
    const checker = this.findLatest(activeLineup, 'check' + hand.state);
    if (checker.last) {
      return activeLineup[(checker.pos + 1) % activeLineup.length].pos;
    } else {
      var err = new Error('BB cannot be undefined');
      if (!bb) throw err;
      if (hand.state === 'preflop' && maxBet.amount === bb) {
        return this.getBbPos(hand.lineup, hand.dealer, hand.state);
      }
      if (activeLineup.length === 2 && hand.state === 'waiting') {
        return activeLineup[1].pos;
      }
    }
    return activeLineup[0].pos;
  }
};

PokerHelper.prototype.isActivePlayer = function(lineup, pos) {
  if (typeof pos === 'undefined' || !lineup) {
    return false;
  }
  if (pos < 0 || pos >= lineup.length || lineup.length < 2) {
    return false;
  }
  // check seat state
  if (lineup[pos].sitout || !lineup[pos].address || lineup[pos].address === EMPTY) {
    return false;
  }
  // get last receipt
  const lastRec = (lineup[pos].last) ? this.rc.get(lineup[pos].last) : null;
  if (!lastRec || !lastRec.abi[0]) {
    return true;
  }
  // check receipt type
  if (lastRec.abi[0].name === 'fold'
    || lastRec.abi[0].name === 'show'
    || lastRec.abi[0].name === 'sitOut') {
    return false;
  }
  return true;
}


PokerHelper.prototype.wasInvolved = function(lineup, pos) {
  if (typeof pos === 'undefined' || !lineup) {
    return false;
  }
  if (pos < 0 || pos >= lineup.length || lineup.length < 2) {
    return false;
  }

  if (lineup[pos].last) {
    const amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    const action = (lineup[pos].last) ? this.rc.get(lineup[pos].last).abi[0].name : '';
    if (action.indexOf('sitOut') < 0) {
      return true;
    } else if (amount > 0) {
      return true;    
    }
  }
  return false;
}

/**
 * @deprecated Since version 0.2.17. Please use nextPlayer(lineup, pos, type) instead
 */
PokerHelper.prototype.nextActivePlayer = function(lineup, playerPos) {
  let newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i++) {
    let pos = i % lineup.length;
    if (this.isActivePlayer(lineup, pos)) {
      newPos = pos;
      break;
    }
  }
  return newPos;
};

PokerHelper.prototype.nextActive = function(lineup, playerPos, state) {
  let newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i++) {
    let pos = i % lineup.length;
    if (this.isActive(lineup[pos], state)) {
      newPos = pos;
      break;
    }
  }
  return newPos;
};

PokerHelper.prototype.nextPlayer = function(lineup, playerPos, type) {
  let newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i++) {
    let pos = i % lineup.length;
    if (type === 'active') {
      if (this.isActivePlayer(lineup, pos)) {
        newPos = pos;
        break;
      }  
    } else if (type === 'involved') {
      if (this.wasInvolved(lineup, pos)) {
        newPos = pos;
        break;
      }
    } else {
      newPos = -1;
    }
  }
  return newPos;
}

PokerHelper.prototype.findMinRaiseAmount = function(lineup, dealer, lastRoundMaxBet) {
  if (!lineup || dealer === undefined) {
    return -1;
  } 
  const max = this.findMaxBet(lineup, dealer);
  if (max.amount === lastRoundMaxBet) {
    return -1;
  } 
  // finding second highest bet
  let secondMax = lastRoundMaxBet;
  for (let i = max.pos + 1; i < lineup.length + max.pos; i++) {
    const pos = i % lineup.length;
    const last = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (last > secondMax && last < max.amount) {
      secondMax = last;
    }
  }
  return max.amount - secondMax;
}

PokerHelper.prototype.getSbPos = function(lineup, dealer) {
  if (typeof dealer === 'undefined' || !lineup) {
    return -1;
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    return -1;
  }
  if (!this.isActivePlayer(lineup, dealer)) {
    return -1;
  }
  const activePlayerCount = this.countActivePlayers(lineup);
  if (activePlayerCount === 2) {
    return dealer;
  }
  const next = this.nextActivePlayer(lineup, dealer + 1);
  if (next === dealer) {
    return -1;
  }
  return next;
}

PokerHelper.prototype.getBbPos = function(lineup, dealer, handState) {
  if (typeof dealer === 'undefined' || !lineup) {
    return -1;
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    return -1;
  }

  let type = (handState === 'dealing' || handState === 'waiting') ? 'active' : 'involved';
  
  const next = this.nextPlayer(lineup, dealer + 1, type);
  if (next === dealer) {
    return -1;
  }
  const activePlayerCount = this.countPlayers(lineup, type);
  if (activePlayerCount === 2) {
    return next;
  }
  const nextNext = this.nextPlayer(lineup, next + 1, type);
  if (nextNext == next) {
    return -1;
  }   
  return nextNext;
}

PokerHelper.prototype.areAllEven = function(lineup) {
  let prev;
  for (let i = 0; i < lineup.length; i++) {
    if (lineup[i].address === EMPTY)
      continue;
    const lastAction = (lineup[i].last) ? this.rc.get(lineup[i].last).abi[0].name : '';
    if (lastAction != 'fold'
      && lastAction != 'sitOut'
      && !lineup[i].sitout) {
      const amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
      if (prev !== undefined && prev != amount) {
        return false;
      }
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
  console.warn('deprecated: Please use getMaxBet(lineup, state) instead');
  dealer = (dealer) ? dealer : 0;
  var max = 0;
  var maxPos;
  for (var i = 0; i < lineup.length; i++) {
    let pos = (i + dealer) % lineup.length;
    if (!lineup[pos].last) {
      continue;
    }
    var amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (amount >= max) {
      max = amount;
      maxPos = pos;
    }
  }
  return { amount: max, pos: maxPos };
}

PokerHelper.prototype.activePlayersLeft = function(hand) {
  console.warn('deprecated: Please use getActiveLineup(lineup).length instead');
  let activeCount = 0;
  for (let pos = 0; pos < hand.lineup.length; pos++) {
    if (this.isActivePlayer(hand.lineup, pos)) {
      activeCount++;
    }
  }
  return activeCount;
}

PokerHelper.prototype.countActivePlayers = function(lineup) {
  let activeCount = 0;
  for (let pos = 0; pos < lineup.length; pos++) {
    if (this.isActivePlayer(lineup, pos)) {
      activeCount++;
    }
  }
  return activeCount;
}

PokerHelper.prototype.countPlayers = function(lineup, type) {
  let counter = 0;
  for (let pos = 0; pos < lineup.length; pos++) {
    if (type === 'active') {
      if (this.isActivePlayer(lineup, pos)) {
        counter++;
      }  
    } else if (type === 'involved') {
      if (this.wasInvolved(lineup, pos)) {
        counter++;
      }  
    }
  }
  return counter;
}


PokerHelper.prototype.lineupHasShow = function(hand) {
  for (let pos = 0; pos < hand.lineup.length; pos++) {
    var receipt = (hand.lineup[pos].last) ? this.rc.get(hand.lineup[pos].last).abi[0].name : '';
    if (receipt.indexOf('show') > -1) {
      return true;
    }
  }
  return false;
}

PokerHelper.prototype.countAllIns = function(hand) {
  if (!hand || !hand.lineup)
    return 0;
  let allInCount = 0;
  for (let pos = 0; pos < hand.lineup.length; pos++) {
    if (hand.lineup[pos].sitout && hand.lineup[pos].sitout === 'allin') {
      allInCount += 1;
    }
  }
  return allInCount;
}

// find out if it is time to start next hand
PokerHelper.prototype.checkForNextHand = function(hand) {
  const activePlayerCount = this.activePlayersLeft(hand);
  const allInPlayerCount = this.countAllIns(hand);
  if (hand.state == 'showdown') {
    if (this.lineupHasShow(hand)) {
      return (activePlayerCount == 0 && allInPlayerCount === 0);  
    } else {
      return (activePlayerCount <= 1 && allInPlayerCount === 0);  
    }
  } else {
    return (activePlayerCount <= 1 && allInPlayerCount === 0);
  }
}

PokerHelper.prototype.inLineup = function(signer, lineup) {
  for (var i = 0; i < lineup.length; i++)
    if (lineup[i].address == signer) {
      return i;
    }
  return -1;
}

PokerHelper.prototype.allDone = function(lineup, dealer, handState, max, bbAmount) {
  let pos, done = true, foundPlayer = 0, foundCheck = 0, checkType;
  let offset = (handState == 'dealing') ? 2 : 0;
  for (let i = 0; i < lineup.length; i++) {
    pos = (i + dealer + offset) % lineup.length;
    if (lineup[pos].address === EMPTY) {
      continue;
    }
    if (!lineup[pos].last && !lineup[pos].sitout) {
      return false;
    }
    
    if (handState == 'dealing')
      continue;
    var receipt = this.rc.get(lineup[pos].last);
    if (receipt && receipt.abi[0].name.indexOf('check') >= 0) {
      if (!checkType) {
        checkType = receipt.abi[0].name;
      }
      if (receipt.abi[0].name == checkType) {
        foundCheck++;
      }
    }
    if (receipt && receipt.abi[0].name !== 'fold'
      && receipt.abi[0].name !== 'sitOut'
      && lineup[pos].address !== EMPTY
      && !lineup[pos].sitout) {
      if (receipt.values[1] != max) {
        return false;
      }
      foundPlayer++;
    }
  }
  if (handState !== 'preflop') {
    if (foundCheck > 0 && (foundCheck < foundPlayer || checkType.toLowerCase().indexOf(handState) < 0)) {
      return false;
    }
  } else {
    if (done && bbAmount) {
      const bbPos = this.getBbPos(lineup, dealer, handState);
      const rec = this.rc.get(lineup[bbPos].last);
      // make sure the bb gets to check preflop if he has not folded or is on sitout.
      if (rec.values[1] == bbAmount 
          && rec.abi[0].name.indexOf('check') < 0 
          && rec.abi[0].name.indexOf('fold') < 0
          && !lineup[bbPos].sitout) {
        return false;
      }
    }
  }
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
  let myPos = -1;
  for (var i = 0; i < lineup.length; i++) {
    if (lineup[i].address == address) {
      myPos = i;
    }
  }
  return myPos;
}

PokerHelper.prototype.getMyMaxBet = function(lineup, address) {
  if (!lineup || !address) {
    return -1;
  }
  let myPos = this.getMyPos(lineup, address);
  if (myPos < 0) {
    return -1;
  }
  let receipt = (lineup[myPos].last) ? this.rc.get(lineup[myPos].last) : undefined;
  return (receipt) ? receipt.values[1] : 0;
}

module.exports = PokerHelper;
