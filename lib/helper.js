import Solver from 'pokersolver';
import ReceiptCache from './receiptCache';

const EMPTY = '0x0000000000000000000000000000000000000000';
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];

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
  let latest = {};
  for (let i = 0; i < lineup.length; i += 1) {
    const lastAction = (lineup[i].last) ? rc.get(lineup[i].last).abi[0].name : '';
    if (lastAction.toLowerCase().indexOf(type) > -1) {
      latest = Object.assign({}, { pos: i, oldPos: lineup[i].pos, last: lastAction});
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
  throw new Error('no active player in lineup');
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
  try {
    const startPos = nextActive(lineup, dealer + 1, state, rc);
    for (let i = startPos; i < lineup.length + startPos; i += 1) {
      const pos = i % lineup.length;
      if (isActive(lineup[pos], state, rc)) {
        const player = Object.assign({}, lineup[pos], { pos });
        activePlayers.push(player);
      }
    }
  } catch (err) {
    if (err.message === 'no active player in lineup') {
      return [];
    }
    throw err;
  }
  return activePlayers;
};

/**
 * wasInvolved
 *
 * @param
 * @returns
 */
const wasInvolved = function wasInvolved(lineup, pos, state) {
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
  if (lineup[pos].address === EMPTY || (lineup[pos].sitout && lineup[pos].sitout !== 'allin')) {
    return false;
  }

  if (state === 'waiting' || state === 'dealing' || lineup[pos].last) {
    return true;
  }
  return false;
};

/**
 * evenLineup
 *
 * @param
 * @returns
 */
const evenLineup = function evenLineup(lineup, rc) {
  let prev;
  for (let i = 0; i < lineup.length; i += 1) {
    const amount = (lineup[i].last) ? rc.get(lineup[i].last).values[1] : 0;
    if (prev !== undefined && prev !== amount) {
      return false;
    }
    prev = amount;
  }
  return true;
};

/**
 * countPlayers counts the players in lineup
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
const countPlayers = function countPlayers(lineup, type, state, rc) {
  let counter = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    if (type === 'active') {
      if (isActive(lineup[pos], state, rc)) {
        counter += 1;
      }
    } else if (type === 'involved') {
      if (wasInvolved(lineup, pos, state, rc)) {
        counter += 1;
      }
    }
  }
  return counter;
};

/**
 * countNoReceipts counts the players in lineup without receipt
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
const countNoReceipts = function countNoReceipts(lineup, rc) {
  let counter = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    if (isActive(lineup[pos], 'waiting', rc) && !lineup[pos].last) {
      counter += 1;
    }
  }
  return counter;
};

const contains = function contains(needle) {
    // Per spec, the way to identify NaN is that it is not equal to itself
  const findNaN = needle !== needle;
  let indexOf;

  if (!findNaN && typeof Array.prototype.indexOf === 'function') {
    indexOf = Array.prototype.indexOf;
  } else {
    indexOf = function indexOf(needle) {
      let i = -1;
      let index = -1;

      for (i = 0; i < this.length; i += 1) {
        const item = this[i];

        if ((findNaN && item !== item) || item === needle) {
          index = i;
          break;
        }
      }

      return index;
    };
  }

  return indexOf.call(this, needle) > -1;
};

/**
 * checks if a certain type of receipt exists
 *
 * @param lineup
 * @param rc
 * @returns bool
 */
const checkForReceipt = function checkForReceipt(lineup, type, rc) {
  for (let pos = 0; pos < lineup.length; pos += 1) {
    const receipt = (lineup[pos].last) ? rc.get(lineup[pos].last).abi[0].name : '';
    if (receipt.indexOf(type) > -1) {
      return true;
    }
  }
  return false;
};

/**
 * countReceipt counts receipts of type in lineup
 *
 * @param lineup
 * @param rc
 * @returns bool
 */
const countReceipts = function countReceipts(lineup, type, rc) {
  if (!lineup) {
    throw new Error('invalid lineup');
  }
  let counter = 0;
  for (let pos = 0; pos < lineup.length; pos += 1) {
    const receipt = (lineup[pos].last) ? rc.get(lineup[pos].last).abi[0].name : '';
    if (receipt.indexOf(type) > -1) {
      counter += 1;
    }
  }
  return counter;
};

function PokerHelper(receiptCache) {
  this.rc = (receiptCache) || new ReceiptCache();
}

// ########## SEAT STATE HELPERS ##########

/**
 * isActivePlayer
 *
 * @param
 * @returns
 */
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

/**
 * inLineup
 *
 * @param
 * @returns
 */
PokerHelper.prototype.inLineup = function inLineup(signer, lineup) {
  for (let i = 0; i < lineup.length; i += 1) {
    if (lineup[i].address === signer) {
      return i;
    }
  }
  return -1;
};

/**
 * getMyMaxBet
 *
 * @param
 * @returns
 */
PokerHelper.prototype.getMyMaxBet = function getMyMaxBet(lineup, address) {
  if (!lineup || !address) {
    throw new Error('invalid params.');
  }
  const myPos = this.getMyPos(lineup, address);
  if (myPos < 0) {
    throw new Error(`address ${address} not in lineup.`);
  }
  const receipt = (lineup[myPos].last) ? this.rc.get(lineup[myPos].last) : undefined;
  return (receipt) ? receipt.values[1] : 0;
};

/**
 * getMyPos
 *
 * @param
 * @returns
 */
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

/**
 * findMinRaiseAmount
 *
 * @param
 * @returns
 */
PokerHelper.prototype.findMinRaiseAmount = function findMinRaiseAmount(lineup, dealer, lastRoundMaxBet, state) {
  if (!lineup || dealer === undefined) {
    throw new Error('invalid params.');
  }
  // TODO: pass correct state
  const max = this.getMaxBet(lineup, state);
  if (max.amount === lastRoundMaxBet) {
    throw new Error('can not find minRaiseAmount.');
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

/**
 * getMaxBet
 *
 * @param
 * @returns
 */
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
  if (pos === -1) {
    throw new Error('could not find max bet.');
  }
  return { amount: max, pos };
};

/**
 * calculatePotsize
 *
 * @param
 * @returns
 */
PokerHelper.prototype.calculatePotsize = function calculatePotsize(lineup) {
  let potSize = 0;
  for (let i = 0; i < lineup.length; i += 1) {
    const receipt = (lineup[i].last) ? this.rc.get(lineup[i].last) : undefined;
    potSize += (receipt) ? receipt.values[1] : 0;
  }
  return potSize;
};

/**
 * isTurn
 *
 * @param
 * @returns
 */
PokerHelper.prototype.isTurn = function isTurn(lineup, dealer, state, bbAmount, addr) {
  const pos = this.getMyPos(lineup, addr);
  return this.getWhosTurn(lineup, dealer, state, bbAmount) === pos;
};

/**
 * getWhosTurn
 *
 * @param
 * @returns
 */
PokerHelper.prototype.getWhosTurn = function getWhosTurn(lineup, dealer, state, bbAmount) {
  if (this.isHandComplete(lineup, dealer, state)) {
    throw new Error('no ones turn if hand complete.');
  }
  const activePlayers = activeLineup(lineup, dealer, state, this.rc);
  let maxBet;

  if (state !== 'waiting') {
    maxBet = this.getMaxBet(activePlayers, state);
    if (!evenLineup(activePlayers, this.rc)) {
      // if betting amounts are not even return next player of to the maxBettor
      return activePlayers[(maxBet.pos + 1) % activePlayers.length].pos;
    }
  }
  const checker = findLatest({ sorted: true, lineup: activePlayers }, `check${state}`, this.rc);
  if (checker.last) {
    return activePlayers[(checker.pos + 1) % activePlayers.length].pos;
  }

  if (state === 'preflop') {
    if (!bbAmount) throw new Error('BB amount cannot be undefined');
    if (maxBet.amount === bbAmount) {
      return this.getBbPos(lineup, dealer, state);
    }
  }

  if (activePlayers.length === 2 && state === 'waiting') {
    return activePlayers[1].pos;
  }

  return activePlayers[0].pos;
};

/**
 * nextPlayer
 *
 * @param
 * @returns
 */
PokerHelper.prototype.nextPlayer = function nextPlayer(lineup, startPos, type, state) {
  let newPos = startPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i += 1) {
    const pos = i % lineup.length;
    if (type === 'active') {
      if (this.isActivePlayer(lineup, pos)) {
        newPos = pos;
        break;
      }
    } else if (type === 'involved') {
      if (wasInvolved(lineup, pos, state, this.rc)) {
        newPos = pos;
        break;
      }
    } else {
      throw new Error('invalid state.');
    }
  }
  return newPos;
};

/**
 * getSbPos
 *
 * @param
 * @returns
 */
PokerHelper.prototype.getSbPos = function getSbPos(lineup, dealer, state) {
  if (typeof dealer === 'undefined' || !lineup) {
    throw new Error('dealer or lineup undefined');
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    throw new Error('lineup not valid.');
  }

  const next = this.nextPlayer(lineup, dealer + 1, 'involved', state);
  const activePlayerCount = countPlayers(lineup, 'involved', state, this.rc);
  if (activePlayerCount < 2) {
    throw new Error('can not find SB if involved player count < 2');
  }
  if (activePlayerCount === 2) {
    return dealer;
  }
  return next;
};

/**
 * getBbPos
 *
 * @param
 * @returns
 */
PokerHelper.prototype.getBbPos = function getBbPos(lineup, dealer, state) {
  if (typeof dealer === 'undefined' || !lineup) {
    throw new Error('invalid params.');
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    throw new Error('invalid more params.');
  }

  const next = this.nextPlayer(lineup, dealer + 1, 'involved', state);
  if (next === dealer) {
    throw new Error('only one player found.');
  }
  const activePlayerCount = countPlayers(lineup, 'involved', state, this.rc);
  if (activePlayerCount === 2) {
    return next;
  }
  const nextNext = this.nextPlayer(lineup, next + 1, 'involved', state);
  if (nextNext === next) {
    throw new Error('only one player found.');
  }
  return nextNext;
};


// ########### COUNTS ###############

/**
 * countActivePlayers counts the active players in lineup
 * used in oracle
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
 * countAllIn counts the number of players that are allin
 * for countAllIns
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
 * isBettingDone checks if a round of betting has completed.
 *
 * @param lineup
 * @param dealer
 * @param state
 * @param max
 * @param bbAmount
 * @returns boolean
 */
PokerHelper.prototype.isBettingDone = function isBettingDone(lineup, dealer, state, bbAmount) {
  if (this.isHandComplete(lineup, dealer, state)) {
    return true;
  }
  const activePlayers = activeLineup(lineup, dealer, state, this.rc);
  let maxBet;
  try {
    maxBet = this.getMaxBet(activePlayers, state);
  } catch (err) {
    if (state === 'waiting') {
      return false;
    }
    throw err;
  }
  if (state === 'waiting') {
    return maxBet.amount > 0;
  }
  if (state === 'dealing') {
    const noRecCount = countNoReceipts(lineup, this.rc);
    if (noRecCount === 0) {
      return true;
    }
  }
  if (!evenLineup(activePlayers, this.rc)) {
    return false;
  }

  const checker = findLatest({ sorted: true, lineup: activePlayers }, 'check', this.rc);
  const bbPos = this.getBbPos(lineup, dealer, state);
  if (checker.last) {
    const checkCount = countReceipts(lineup, 'check', this.rc);
    // prefop wait until BB has checked
    if (this.rc.get(lineup[bbPos].last).abi[0].name === 'checkPre') {
      return true;
    }
    // on other streets wait until all active players have checked
    if (checker.last.toLowerCase() === `check${state}` && checkCount === activePlayers.length) {
      return true;
    }
    return false;
  }
  if (state === 'preflop') {
    if (!bbAmount) throw new Error('BB amount cannot be undefined');
    const bbRec = this.rc.get(lineup[bbPos].last);
    if (isActive(lineup[bbPos], state, this.rc) &&
      bbRec.abi[0].name !== 'checkPre' &&
      maxBet.amount === bbAmount) {
      return false;
    }
  }
  return true;
};

/**
 * isHandComplete checks if the hand is complete.
 * the complete state is met when the second to last player folded or timed out,
 * or once everyone has shown in showdown.
 * replaces: checkForNextHand
 *
 * @param lineup
 * @param dealer
 * @param state
 * @returns boolean
 */
PokerHelper.prototype.isHandComplete = function isHandComplete(lineup, dealer, state) {
  const activePlayers = activeLineup(lineup, dealer, state, this.rc);
  const allInPlayerCount = this.countAllIn(lineup);
  if (state === 'showdown') {
    if (checkForReceipt(lineup, 'show', this.rc)) {
      return (activePlayers.length === 0 && allInPlayerCount === 0);
    }
    return (activePlayers.length <= 1 && allInPlayerCount === 0);
  }
  return (activePlayers.length <= 1 && allInPlayerCount === 0);
};

/**
 * renderHand
 *
 * @param
 * @returns
 */
PokerHelper.prototype.renderHand = function renderHand(handId, lineupParam, dealer,
  sb, state, changed, deck, preMaxBet, flopMaxBet, turnMaxBet, riverMaxBet,
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
    sb,
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

/**
 * calcDistribution evaluates a hand and creates a distribution
 *
 * @param lineup
 * @param state
 * @param boardCards
 * @param rakePerMil
 * @param rakeAddr
 * @returns signed distribution
 */
PokerHelper.prototype.calcDistribution = function calcDistribution(lineup, state, boardCards, rakePerMil, rakeAddr) {
  if (!state || !lineup) {
    throw new Error('invalid params');
  }
  let i;
  let j;
  const pots = [];
  const players = [];
  let active;
  let last;
  // create pots
  for (i = 0; i < lineup.length; i += 1) {
    last = (lineup[i].last) ? this.rc.get(lineup[i].last) : null;
    if (last) {
      active = false;
      if (state === 'showdown') {
        if (last.abi[0].name === 'show' || last.abi[0].name === 'muck') {
          if (!contains.call(pots, last.values[1])) {
            pots.push(last.values[1]);
          }
          active = true;
        }
      } else if (this.isActivePlayer(lineup, i)
          || lineup[i].sitout === 'allin') {
        if (!contains.call(pots, last.values[1])) {
          pots.push(last.values[1]);
        }
        active = true;
      }
      players.push({
        pos: i,
        active,
        amount: last.values[1],
      });
    }
  }
  // sort the pots
  pots.sort((a, b) => a - b);
  const evals = [];
  for (i = 0; i < pots.length; i += 1) {
    evals.push({ limit: pots[i], size: 0, chal: [], winners: [] });
  }
  // console.log(JSON.stringify(pots));

  // distribute players on evals
  for (i = 0; i < evals.length; i += 1) {
    for (j = 0; j < players.length; j += 1) {
      if (players[j].amount > 0) {
        const limit = (i > 0) ? evals[i].limit - evals[i - 1].limit : evals[i].limit;
        let contribution = limit;
        if (limit > players[j].amount) {
          contribution = players[j].amount;
        }
        evals[i].size += contribution;
        players[j].amount -= contribution;
        if (players[j].active) {
          evals[i].chal.push(players[j].pos);
        }
      }
    }
  }
  // console.log(JSON.stringify(evals));

  // solve hands
  for (i = 0; i < evals.length; i += 1) {
    if (evals[i].chal.length > 1) {
      const hands = [];
      for (j = 0; j < evals[i].chal.length; j += 1) {
        const h = [];
        // hole cards
        let card = lineup[evals[i].chal[j]].cards[0];
        h.push(VALUES[card % 13] + SUITS[Math.floor(card / 13)]);
        card = lineup[evals[i].chal[j]].cards[1];
        h.push(VALUES[card % 13] + SUITS[Math.floor(card / 13)]);
        // board cards
        h.push(VALUES[boardCards[0] % 13] + SUITS[Math.floor(boardCards[0] / 13)]);
        h.push(VALUES[boardCards[1] % 13] + SUITS[Math.floor(boardCards[1] / 13)]);
        h.push(VALUES[boardCards[2] % 13] + SUITS[Math.floor(boardCards[2] / 13)]);
        h.push(VALUES[boardCards[3] % 13] + SUITS[Math.floor(boardCards[3] / 13)]);
        h.push(VALUES[boardCards[4] % 13] + SUITS[Math.floor(boardCards[4] / 13)]);
        hands.push(Solver.Hand.solve(h));
      }
      const wnrs = Solver.Hand.winners(hands);
      for (j = 0; j < wnrs.length; j += 1) {
        const pos = evals[i].chal[hands.indexOf(wnrs[j])];
        evals[i].winners.push(pos);
      }
    } else {
      evals[i].winners.push(evals[i].chal[0]);
    }
  }
  // console.log(JSON.stringify(evals));

  // sum up pots by players and calc rake
  const winners = {};
  for (i = 0; i < evals.length; i += 1) {
    let total = evals[i].size;
    for (j = 0; j < evals[i].winners.length; j += 1) {
      const addr = lineup[evals[i].winners[j]].address;
      if (!winners[addr]) {
        winners[addr] = 0;
      }
      const share = Math.floor((evals[i].size - ((evals[i].size / 1000) * rakePerMil)) / evals[i].winners.length);
      total -= share;
      winners[addr] += share;
    }
    if (!winners[rakeAddr]) {
      winners[rakeAddr] = 0;
    }
    winners[rakeAddr] += total;
  }
  // console.log(JSON.stringify(winners));
  return winners;
};


// ############# DEPRECATED #############


/**
 *
 * @param lineup
 * @param dealer (number between 0 and lineup.length) the pos the dealer button is at on the table
 * @returns {{amount: number, pos: *}}
 * @deprecated Since version 0.3.10. Please use isHandComplete(lineup, dealer, state) instead
 */
PokerHelper.prototype.findMaxBet = function findMaxBet(lineup, dealer, state) {
  console.warn('deprecated: Please use getMaxBet(lineup, state) instead');
  return this.getMaxBet(lineup, state);
};


/**
 * allDone checks if a round of betting has completed.
 *
 * @param lineup
 * @param dealer
 * @param state
 * @param max
 * @param bbAmount
 * @returns boolean
 * @deprecated Since version 0.3.10. Please use isBettingDone(lineup, dealer, state) instead
 */
PokerHelper.prototype.allDone = function allDone(lineup, dealer, state, max, bbAmount) {
  console.warn('deprecated: Please use isBettingDone(lineup, dealer, state) instead');
  return this.isBettingDone(lineup, dealer, state, bbAmount);
};

/**
 * @deprecated Since version 0.3.10. Please use isHandComplete(lineup, dealer, state) instead
 */
PokerHelper.prototype.checkForNextHand = function checkForNextHand(hand) {
  console.warn('deprecated: Please use isHandComplete(lineup, dealer, state) instead');
  return this.isHandComplete(hand.lineup, hand.dealer, hand.state);
};


/**
 * @deprecated Since version 0.3.10. Please use isTurn(lineup, dealer, state, bbAmount, addr) instead
 */
PokerHelper.prototype.isMyTurn = function isMyTurn(hand, myPos) {
  console.warn('deprecated: Please use isTurn(lineup, state) instead');
  return this.isTurn(hand.lineup, hand.dealer, hand.state, hand.sb * 2, hand.lineup[myPos].address);
};


/**
 * @deprecated Since version 0.3.10. Please use getWhosTurn(lineup, dealer, state, bbAmount) instead
 */
PokerHelper.prototype.whosTurn = function whosTurn(hand, bbAmount) {
  console.warn('deprecated: use getWhosTurn(lineup, dealer, state, bbAmount) instead');
  return this.getWhosTurn(hand.lineup, hand.dealer, hand.state, bbAmount);
};


/**
 * @deprecated Since version 0.2.17. Please use nextPlayer(lineup, pos, type) instead
 */
PokerHelper.prototype.nextActivePlayer = function nextActivePlayer(lineup, startPos) {
  console.warn('deprecated: use use nextPlayer(lineup, pos, type) instead');
  return this.nextPlayer(lineup, startPos, 'active');
};

/**
 * @deprecated Since version 0.3.10. Please use countActivePlayers(lineup, state) instead
 */
PokerHelper.prototype.activePlayersLeft = function activePlayersLeft(hand) {
  console.warn('deprecated: Please use countActivePlayers(lineup, state) instead');
  return this.countActivePlayers(hand.lineup, hand.state);
};

/**
 * @deprecated Since version 0.3.10. Please use countAllIn(lineup) instead
 */
PokerHelper.prototype.countAllIns = function countAllIns(hand) {
  console.warn('deprecated: Please use countAllIn(lineup) instead');
  return this.countAllIn(hand.lineup);
};


module.exports = PokerHelper;
