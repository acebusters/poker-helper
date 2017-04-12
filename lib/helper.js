import ReceiptCache from './receiptCache';

const EMPTY = '0x0000000000000000000000000000000000000000';

/**
 * findLatest find a receipt type used latest in an activeLineup
 *
 * @param lineup of type activeLineup
 * @returns {{ pos: number, last: receipt }}
 */
const findLatest = function findLatest(activeLineup, type, rc) {
  if (!activeLineup.sorted) {
    throw new Error('active lineup expected.');
  }
  const lineup = activeLineup.lineup;
  const latest = {};
  for (let i = 0; i < lineup.length; i += 1) {
    const lastAction = (lineup[i].last) ? rc.get(lineup[i].last).abi[0].name : '';
    if (lastAction.toLowerCase().indexOf(type) > -1) {
      latest.pos = i;
      latest.last = lastAction;
    }
  }
  return latest;
};

/**
 * isActive check if a seat in active
 *
 * @param lineup
 * @param state
 * @param receiptCache
 * @returns bool
 */
const isActive = function isActive(player, state, rc) {
  if (typeof player === 'undefined' || player === null) {
    throw new Error('player undefined');
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
  const lastRec = (player.last) ? rc.get(player.last) : null;
  if (!lastRec || !lastRec.abi[0] || !lastRec.values) {
    // in waiting or dealing a player might not have a receipt yet
    if (state === 'waiting' || state === 'dealing') {
      if (player.sitout) {
        return false;
      }
      return true;
    }
    if (player.sitout) {
      return false;
    }
    throw new Error('receipt undefined');
  } else {
    const amount = lastRec.values[1];
    // check receipt type for receipts we don't want
    if (lastRec.abi[0].name === 'fold'
      || lastRec.abi[0].name === 'show'
      || player.sitout
      || (lastRec.abi[0].name === 'sitOut' && amount > 0)) {
      return false;
    }
    // we have a receipt with a wanted receipt type
    return true;
  }
};

/**
 * nextActive returns next active players
 *
 * @param lineup
 * @param palyerPos as index in lineup
 * @param state
 * @param receiptCache
 * @returns index in lineup
 */
const nextActive = function nextActive(lineup, playerPos, state, rc) {
  const newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i += 1) {
    const pos = i % lineup.length;
    if (isActive(lineup[pos], state, rc)) {
      return pos;
    }
  }
  throw new Error('could not determine next active');
};

/**
 * activeLineup returns normalized lineup with active players
 *
 * @param lineup
 * @param dealer position as index to lineup
 * @param state
 * @returns activeLineup array
 */
const activeLineup = function activeLineup(lineup, dealer, state, rc) {
  const activePlayers = [];
  const startPos = nextActive(lineup, dealer + 1, state, rc);
  for (let i = startPos; i < lineup.length + startPos; i += 1) {
    const pos = i % lineup.length;
    if (isActive(lineup[pos], state, rc)) {
      const player = Object.assign({}, lineup[pos], { pos });
      activePlayers.push(player);
    }
  }
  return activePlayers;
};

function PokerHelper(receiptCache) {
  this.rc = (receiptCache) || new ReceiptCache();
}

// ########## SEAT STATE HELPERS ##########

PokerHelper.prototype.isActivePlayer = function isActivePlayer(lineup, pos, state) {
  if (typeof pos === 'undefined' || !lineup) {
    throw new Error('lineup undefined');
  }
  if (pos < 0 || pos >= lineup.length || lineup.length < 2) {
    throw new Error(`bad param pos: ${pos}`);
  }
  // TODO: pass correct hand state
  return isActive(lineup[pos], state, this.rc);
};


PokerHelper.prototype.wasInvolved = function wasInvolved(lineup, pos, state) {
  if (typeof pos === 'undefined' || !lineup) {
    throw new Error(`bad param pos: ${pos}`);
  }
  if (pos < 0 || pos >= lineup.length || lineup.length < 2) {
    throw new Error('invalid lineup');
  }
  if (!lineup[pos].address) {
    throw new Error('invalid seat');
  }
  // check seat state
  if (lineup[pos].address === EMPTY) {
    return false;
  }

  if (lineup[pos].last) {
    const amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    const action = (lineup[pos].last) ? this.rc.get(lineup[pos].last).abi[0].name : '';
    if (action.indexOf('sitOut') >= 0 && amount === 0) {
      return false;
    }
    return true;
  }
    // has no receipt
  if (state === 'waiting' || state === 'dealing') {
    if (!lineup[pos].sitout) {
      return true;
    }
  }
  if (lineup[pos].sitout) {
    return false;
  }
  throw new Error('receipt missing');
};

PokerHelper.prototype.inLineup = function inLineup(signer, lineup) {
  for (let i = 0; i < lineup.length; i += 1) {
    if (lineup[i].address === signer) {
      return i;
    }
  }
  return -1;
};

PokerHelper.prototype.getMyMaxBet = function getMyMaxBet(lineup, address) {
  if (!lineup || !address) {
    return -1;
  }
  const myPos = this.getMyPos(lineup, address);
  if (myPos < 0) {
    return -1;
  }
  const receipt = (lineup[myPos].last) ? this.rc.get(lineup[myPos].last) : undefined;
  return (receipt) ? receipt.values[1] : 0;
};


PokerHelper.prototype.getMyPos = function getMyPos(lineup, address) {
  let myPos = -1;
  for (let i = 0; i < lineup.length; i += 1) {
    if (lineup[i].address === address) {
      myPos = i;
    }
  }
  return myPos;
};


// ########## LINEUP STATE HELPERS ##########


PokerHelper.prototype.getActiveLineup = function getActiveLineup(lineup, dealer, state) {
  return activeLineup(lineup, dealer, state, this.rc);
};


PokerHelper.prototype.evenLineup = function evenLineup(lineup) {
  let prev;
  for (let i = 0; i < lineup.length; i += 1) {
    const amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
    if (prev !== undefined && prev !== amount) {
      return false;
    }
    prev = amount;
  }
  return true;
};


PokerHelper.prototype.areAllEven = function areAllEven(lineup) {
  let prev;
  for (let i = 0; i < lineup.length; i += 1) {
    if (lineup[i].address === EMPTY) { continue; }
    const lastAction = (lineup[i].last) ? this.rc.get(lineup[i].last).abi[0].name : '';
    if (lastAction !== 'fold'
      && lastAction !== 'sitOut'
      && !lineup[i].sitout) {
      const amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
      if (prev !== undefined && prev !== amount) {
        return false;
      }
      prev = amount;
    }
  }
  return true;
};

PokerHelper.prototype.findMinRaiseAmount = function findMinRaiseAmount(lineup, dealer, lastRoundMaxBet) {
  if (!lineup || dealer === undefined) {
    return -1;
  }
  const max = this.findMaxBet(lineup, dealer);
  if (max.amount === lastRoundMaxBet) {
    return -1;
  }
  // finding second highest bet
  let secondMax = lastRoundMaxBet;
  for (let i = max.pos + 1; i < lineup.length + max.pos; i += 1) {
    const pos = i % lineup.length;
    const last = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (last > secondMax && last < max.amount) {
      secondMax = last;
    }
  }
  return max.amount - secondMax;
};


PokerHelper.prototype.getMaxBet = function getMaxBet(lineup, state) {
  let max = 0;
  let pos = -1;
  for (let i = 0; i < lineup.length; i += 1) {
    if (!lineup[i].last) {
      continue;
    }
    const amount = (lineup[i].last) ? this.rc.get(lineup[i].last).values[1] : 0;
    // if we are in dealing the last 0 bet is the max bet
    if (amount >= max || (amount === 0 && state === 'dealing')) {
      max = amount;
      pos = i;
    }
  }
  return { amount: max, pos };
};


PokerHelper.prototype.calculatePotsize = function calculatePotsize(lineup) {
  let potSize = 0;
  for (let i = 0; i < lineup.length; i += 1) {
    const receipt = (lineup[i].last) ? this.rc.get(lineup[i].last) : undefined;
    potSize += (receipt) ? receipt.values[1] : 0;
  }
  return potSize;
};


PokerHelper.prototype.isTurn = function isTurn(lineup, dealer, state, bb, addr) {
  throw new Error('not implemented');
};


PokerHelper.prototype.getTurn = function getTurn(lineup, dealer, state, bb) {
  throw new Error('not implemented');
};

PokerHelper.prototype.nextPlayer = function nextPlayer(lineup, playerPos, type, state) {
  let newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i += 1) {
    const pos = i % lineup.length;
    if (type === 'active') {
      if (this.isActivePlayer(lineup, pos)) {
        newPos = pos;
        break;
      }
    } else if (type === 'involved') {
      if (this.wasInvolved(lineup, pos, state)) {
        newPos = pos;
        break;
      }
    } else {
      newPos = -1;
    }
  }
  return newPos;
};


PokerHelper.prototype.getSbPos = function getSbPos(lineup, dealer, state) {
  if (typeof dealer === 'undefined' || !lineup) {
    throw new Error('dealer or lineup undefined');
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    throw new Error('lineup not valid.');
  }

  const next = this.nextPlayer(lineup, dealer + 1, 'involved', state);
  const activePlayerCount = this.countPlayers(lineup, 'involved', state);
  if (activePlayerCount < 2) {
    throw new Error('can not find SB if involved player count < 2');
  }
  if (activePlayerCount === 2) {
    return dealer;
  }
  return next;
};


PokerHelper.prototype.getBbPos = function getBbPos(lineup, dealer, state) {
  if (typeof dealer === 'undefined' || !lineup) {
    return -1;
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    return -1;
  }

  const next = this.nextPlayer(lineup, dealer + 1, 'involved', state);
  if (next === dealer) {
    return -1;
  }
  const activePlayerCount = this.countPlayers(lineup, 'involved', state);
  if (activePlayerCount === 2) {
    return next;
  }
  const nextNext = this.nextPlayer(lineup, next + 1, 'involved', state);
  if (nextNext === next) {
    return -1;
  }
  return nextNext;
};


// ########### COUNTS ###############

/**
 * countActivePlayers counts the active players in lineup
 *
 * @param lineup
 * @returns number of active players
 */
PokerHelper.prototype.countActivePlayers = function countActivePlayers(lineup, state) {
  let activeCount = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    if (this.isActivePlayer(lineup, pos, state)) {
      activeCount += 1;
    }
  }
  return activeCount;
};

/**
 * countPlayers counts the players in lineup
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
PokerHelper.prototype.countPlayers = function countPlayers(lineup, type, state) {
  let counter = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    if (type === 'active') {
      if (this.isActivePlayer(lineup, pos, state)) {
        counter += 1;
      }
    } else if (type === 'involved') {
      if (this.wasInvolved(lineup, pos, state)) {
        counter += 1;
      }
    }
  }
  return counter;
};

/**
 * countAllIn counts the number of players that are allin
 *
 * @param lineup
 * @returns number of all-in players
 */
PokerHelper.prototype.countAllIn = function countAllIn(lineup) {
  if (!lineup) { 
    throw new Error('invalid lineup');
  }
  let allInCount = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    if (lineup[pos].sitout && lineup[pos].sitout === 'allin') {
      allInCount += 1;
    }
  }
  return allInCount;
};

// ########### HAND STATE RELATED ############

/**
 * isHandComplete counts the players in lineup
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
PokerHelper.prototype.isHandComplete = function isHandComplete(lineup, dealer, state) {
  const activePlayerCount = activeLineup(lineup, dealer, state, this.rc).length;
  const allInPlayerCount = this.countAllIn(lineup);
  if (state === 'showdown') {
    if (this.lineupHasShow({ lineup })) {
      return (activePlayerCount === 0 && allInPlayerCount === 0);
    }
    return (activePlayerCount <= 1 && allInPlayerCount === 0);
  }
  return (activePlayerCount <= 1 && allInPlayerCount === 0);
};


PokerHelper.prototype.allDone = function allDone(lineup, dealer, handState, max, bbAmount) {
  let pos;
  const done = true;
  let foundPlayer = 0;
  let foundCheck = 0;
  let checkType;
  const offset = (handState === 'dealing') ? 2 : 0;
  for (let i = 0; i < lineup.length; i += 1) {
    pos = (i + dealer + offset) % lineup.length;
    if (lineup[pos].address === EMPTY) {
      continue;
    }
    if (!lineup[pos].last && !lineup[pos].sitout) {
      return false;
    }

    if (handState === 'dealing') {
      continue;
    }
    const receipt = this.rc.get(lineup[pos].last);
    if (receipt && receipt.abi[0].name.indexOf('check') >= 0) {
      if (!checkType) {
        checkType = receipt.abi[0].name;
      }
      if (receipt.abi[0].name === checkType) {
        foundCheck += 1;
      }
    }
    if (receipt && receipt.abi[0].name !== 'fold'
      && receipt.abi[0].name !== 'sitOut'
      && lineup[pos].address !== EMPTY
      && !lineup[pos].sitout) {
      if (receipt.values[1] !== max) {
        return false;
      }
      foundPlayer += 1;
    }
  }
  if (handState !== 'preflop') {
    if (foundCheck > 0 && (foundCheck < foundPlayer
      || checkType.toLowerCase().indexOf(handState) < 0)) {
      return false;
    }
  } else if (done && bbAmount) {
    const bbPos = this.getBbPos(lineup, dealer, handState);
    const rec = this.rc.get(lineup[bbPos].last);
      // make sure the bb gets to check preflop if he has not folded or is on sitout.
    if (rec.values[1] === bbAmount
          && rec.abi[0].name.indexOf('check') < 0
          && rec.abi[0].name.indexOf('fold') < 0
          && !lineup[bbPos].sitout) {
      return false;
    }
  }
  return done;
};


PokerHelper.prototype.renderHand = function renderHand(handId, lineupParam, dealer,
  state, changed, deck, preMaxBet, flopMaxBet, turnMaxBet, riverMaxBet,
  distribution, netting) {
  const lineup = lineupParam.slice();
  if (state === 'showdown') {
    for (let i = 0; i < lineup.length; i += 1) {
      if (lineup[i].last) {
        const last = this.rc.get(lineup[i].last);
        if (last.abi[0].name === 'show') {
          lineup[i].cards = [];
          lineup[i].cards.push(deck[i * 2]);
          lineup[i].cards.push(deck[(i * 2) + 1]);
        }
      }
    }
  }
  const rv = {
    handId,
    lineup,
    dealer,
    state,
    changed,
    cards: [],
  };
  if (state === 'flop') {
    rv.preMaxBet = preMaxBet;
    rv.cards.push(deck[20]);
    rv.cards.push(deck[21]);
    rv.cards.push(deck[22]);
  }
  if (state === 'turn') {
    rv.preMaxBet = preMaxBet;
    rv.flopMaxBet = flopMaxBet;
    rv.cards.push(deck[20]);
    rv.cards.push(deck[21]);
    rv.cards.push(deck[22]);
    rv.cards.push(deck[23]);
  }
  if (state === 'river') {
    rv.preMaxBet = preMaxBet;
    rv.flopMaxBet = flopMaxBet;
    rv.turnMaxBet = turnMaxBet;
    rv.cards.push(deck[20]);
    rv.cards.push(deck[21]);
    rv.cards.push(deck[22]);
    rv.cards.push(deck[23]);
    rv.cards.push(deck[24]);
  }
  if (state === 'showdown') {
    rv.preMaxBet = preMaxBet;
    rv.flopMaxBet = flopMaxBet;
    rv.turnMaxBet = turnMaxBet;
    rv.riverMaxBet = riverMaxBet;
    rv.cards.push(deck[20]);
    rv.cards.push(deck[21]);
    rv.cards.push(deck[22]);
    rv.cards.push(deck[23]);
    rv.cards.push(deck[24]);
  }
  if (distribution) {
    rv.distribution = distribution;
  }
  if (netting) {
    rv.netting = netting;
  }
  return rv;
};


// ############# DEPRECATED #############


/**
 *
 * @param lineup
 * @param dealer (number between 0 and lineup.length) the pos the dealer button is at on the table
 * @returns {{amount: number, pos: *}}
 */
PokerHelper.prototype.findMaxBet = function findMaxBet(lineup, dealerParam) {
  console.warn('deprecated: Please use getMaxBet(lineup, state) instead');
  const dealer = (dealerParam) || 0;
  let max = 0;
  let maxPos;
  for (let i = 0; i < lineup.length; i += 1) {
    const pos = (i + dealer) % lineup.length;
    if (!lineup[pos].last) {
      continue;
    }
    const amount = (lineup[pos].last) ? this.rc.get(lineup[pos].last).values[1] : 0;
    if (amount >= max) {
      max = amount;
      maxPos = pos;
    }
  }
  return { amount: max, pos: maxPos };
};

/**
 * @deprecated Since version 0.3.10. Please use isHandComplete(lineup, dealer, state) instead
 */
PokerHelper.prototype.checkForNextHand = function checkForNextHand(hand) {
  console.warn('deprecated: Please use isHandComplete(lineup, dealer, state) instead');
  const activePlayerCount = this.activePlayersLeft(hand);
  const allInPlayerCount = this.countAllIn(hand.lineup);
  if (hand.state === 'showdown') {
    if (this.lineupHasShow(hand)) {
      return (activePlayerCount === 0 && allInPlayerCount === 0);
    }
    return (activePlayerCount <= 1 && allInPlayerCount === 0);
  }
  return (activePlayerCount <= 1 && allInPlayerCount === 0);
};


/**
 * @deprecated Since version 0.3.10. Please use isTurn(lineup, dealer, state, bb, addr) instead
 */
PokerHelper.prototype.isMyTurn = function isMyTurn(hand, myPos) {
  console.warn('deprecated: Please use isTurn(lineup, state) instead');
  return this.whosTurn(hand, hand.sb * 2) === myPos;
};


/**
 * @deprecated Since version 0.3.10. Please use getTurn(lineup, dealer, state, bb) instead
 */
PokerHelper.prototype.whosTurn = function whosTurn(hand, bb) {
  if (this.isHandComplete(hand.lineup, hand.dealer, hand.state)) {
    throw new Error('no ones turn if hand complete.');
  }
  const activePlayers = activeLineup(hand.lineup, hand.dealer, hand.state, this.rc);

  const maxBet = this.getMaxBet(activePlayers, hand.state);
  if (!this.evenLineup(activePlayers)) {
    // if betting amounts are not even return next player of to the maxBettor
    return activePlayers[(maxBet.pos + 1) % activePlayers.length].pos;
  }
  const checker = findLatest({ sorted: true, lineup: activePlayers }, `check${hand.state}`, this.rc);
  if (checker.last) {
    return activePlayers[(checker.pos + 1) % activePlayers.length].pos;
  }
  if (hand.state === 'preflop') {
    if (!bb) throw new Error('BB cannot be undefined');
    if (maxBet.amount === bb) {
      return this.getBbPos(hand.lineup, hand.dealer, hand.state);
    }
  }
  if (activePlayers.length === 2 && hand.state === 'waiting') {
    return activePlayers[1].pos;
  }

  return activePlayers[0].pos;
};


/**
 * @deprecated Since version 0.2.17. Please use nextPlayer(lineup, pos, type) instead
 */
PokerHelper.prototype.nextActivePlayer = function nextActivePlayer(lineup, playerPos) {
  let newPos = playerPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i += 1) {
    const pos = i % lineup.length;
    if (this.isActivePlayer(lineup, pos)) {
      newPos = pos;
      break;
    }
  }
  return newPos;
};

/**
 * lineupHasShow counts the show receipts in lineup
 *
 * @param lineup
 * @param type
 * @returns number of active players
 # @deprecated Since version 0.3.10. Please use chountShows(lineup) instead
 */
PokerHelper.prototype.lineupHasShow = function lineupHasShow(hand) {
  console.warn('deprecated: Please use countShows(lineup) instead');
  for (let pos = 0; pos < hand.lineup.length; pos += 1) {
    const receipt = (hand.lineup[pos].last) ? this.rc.get(hand.lineup[pos].last).abi[0].name : '';
    if (receipt.indexOf('show') > -1) {
      return true;
    }
  }
  return false;
};

/**
 * @deprecated Since version 0.3.10. Please use getActiveLineup(lineup).length instead
 */
PokerHelper.prototype.activePlayersLeft = function activePlayersLeft(hand) {
  console.warn('deprecated: Please use getActiveLineup(lineup).length instead');
  let activeCount = 0;
  for (let pos = 0; pos < hand.lineup.length; pos += 1) {
    if (this.isActivePlayer(hand.lineup, pos)) {
      activeCount += 1;
    }
  }
  return activeCount;
};

/**
 * @deprecated Since version 0.3.10. Please use countAllIn(lineup) instead
 */
PokerHelper.prototype.countAllIns = function countAllIns(hand) {
  console.warn('deprecated: Please use countAllIn(lineup) instead');
  return this.countAllIn(hand.lineup);
};


module.exports = PokerHelper;
