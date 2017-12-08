/* eslint-disable class-methods-use-this */

import Solver from 'ab-pokersolver';
import ReceiptCache from './receiptCache';
import { Type } from './receipt';

const EMPTY = '0x0000000000000000000000000000000000000000';
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['c', 'd', 'h', 's'];

const getPlayers = (helper, state, rawLineup, withSitouts = true) => {
  const lineup = withSitouts ? rawLineup : rawLineup.map(({ sitout, ...seat }) => seat);
  const players = lineup.reduce((list, seat, pos) => {
    if (seat.last) {
      const last = helper.rc.get(seat.last);
      const active = (
        (state === 'showdown' && last.type === Type.SHOW) ||
        (state !== 'showdown' && (helper.isActivePlayer(lineup, pos) || seat.sitout === 'allin'))
      );

      return [...list, { pos, active, amount: last.amount.toNumber() }];
    }

    return list;
  }, []);
  const activePlayers = players.filter(p => p.active);

  if (activePlayers.length === 0 && withSitouts) {
    return getPlayers(helper, state, rawLineup, false);
  }

  return players;
};

/**
 * findLatest find a receipt type used latest in an activeLineup
 *
 * @param lineup of type activeLineup
 * @returns {{ pos: number, last: receipt }}
 */
const findLatest = (activeLineup, minType = 0, rc) => {
  if (!activeLineup.sorted) {
    throw new Error('active lineup expected.');
  }
  const lineup = activeLineup.lineup;
  let latest = {};
  for (let i = 0; i < lineup.length; i += 1) {
    const lastRec = (lineup[i].last) ? rc.get(lineup[i].last) : null;
    if (lastRec && lastRec.type >= minType && lastRec.type <= Type.CHECK_RIVER) {
      minType = lastRec.type; // eslint-disable-line no-param-reassign
      latest = Object.assign({}, { pos: i, oldPos: lineup[i].pos, last: lineup[i].last });
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
export const isActive = (player, state, rc) => {
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
  if (!lastRec || !lastRec.type || !lastRec.amount) {
    // in waiting or dealing a player might not have a receipt yet
    if (state === 'waiting' || state === 'dealing') {
      return true;
    }
    throw new Error('receipt undefined');
  } else {
    // check receipt type for receipts we don't want
    if (lastRec.type === Type.FOLD
      || lastRec.type === Type.SHOW
      || (lastRec.type === Type.SIT_OUT && state !== 'waiting' && state !== 'dealing')) {
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
const nextActive = (lineup, playerPos, state, rc) => {
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
 * wasInvolved
 *
 * @param
 * @returns
 */
const wasInvolved = (lineup, pos, state) => {
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
 * countPlayers counts the players in lineup
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
const countPlayers = (lineup, type, state, rc) => {
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
 * findNextPlayer
 *
 * @param
 * @returns
 */
const findNextPlayer = (lineup, startPos, type, state, rc) => {
  let newPos = startPos % lineup.length;
  for (let i = newPos; i < lineup.length + newPos; i += 1) {
    const pos = i % lineup.length;
    if (type === 'active') {
      if (isActive(lineup[pos], state, rc)) {
        newPos = pos;
        break;
      }
    } else if (type === 'involved') {
      if (wasInvolved(lineup, pos, state, rc)) {
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
 * findBbPos
 *
 * @param
 * @returns
 */
const findBbPos = (lineup, dealer, state, rc) => {
  if (typeof dealer === 'undefined' || !lineup) {
    throw new Error('invalid params.');
  }
  if (dealer < 0 || dealer >= lineup.length || lineup.length < 2) {
    throw new Error('invalid more params.');
  }

  const next = findNextPlayer(lineup, dealer + 1, 'involved', state, rc);
  if (next === dealer) {
    throw new Error('only one player found.');
  }
  const activePlayerCount = countPlayers(lineup, 'involved', state, rc);
  if (activePlayerCount === 2) {
    return next;
  }
  const nextNext = findNextPlayer(lineup, next + 1, 'involved', state, rc);
  if (nextNext === next) {
    throw new Error('only one player found.');
  }
  return nextNext;
};

/**
 * activeLineup returns normalized lineup with active players
 *
 * @param lineup
 * @param dealer position as index to lineup
 * @param state
 * @returns activeLineup array
 */
const activeLineup = (lineup, dealer, state, rc) => {
  const activePlayers = [];
  try {
    let startPos;
    if (state === 'preflop') {
      // BB is last to act
      try {
        const bbPos = findBbPos(lineup, dealer, state, rc);
        startPos = nextActive(lineup, bbPos + 1, state, rc);
      } catch (err) {
        // not able to find bb in lineup, not enough players?
      }
    }
    if (state !== 'preflop' || typeof startPos === 'undefined') {
      // BU is last to act
      startPos = nextActive(lineup, dealer + 1, state, rc);
    }
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
 * evenLineup
 *
 * @param
 * @returns
 */
const evenLineup = (lineup, rc) => {
  let prev;
  for (let i = 0; i < lineup.length; i += 1) {
    const amount = (lineup[i].last) ? rc.get(lineup[i].last).amount.toNumber() : 0;
    if (prev !== undefined && prev !== amount) {
      return false;
    }
    prev = amount;
  }
  return true;
};

/**
 * countNoReceipts counts the players in lineup without receipt
 *
 * @param lineup
 * @param type
 * @returns number of active players
 */
const countNoReceipts = (lineup, rc) => (
  lineup.filter(seat => isActive(seat, 'waiting', rc) && !seat.last).length
);

/**
 * checks if a certain type of receipt exists
 *
 * @param lineup
 * @param rc
 * @returns bool
 */
const checkForReceipt = (lineup, type, rc) => lineup.some((seat) => {
  const receipt = seat.last ? rc.get(seat.last) : null;
  return receipt && receipt.type === type;
});

/**
 * countReceipt counts receipts of type in lineup
 *
 * @param lineup
 * @param type - as lower case
 * @param rc
 * @returns bool
 */
const countReceipts = (lineup, type, rc) => {
  if (!lineup) {
    throw new Error('invalid lineup');
  }

  return lineup.filter((seat) => {
    const receipt = (seat.last) ? rc.get(seat.last) : null;
    return receipt && receipt.type === type;
  }).length;
};


/**
 * maxAllIn gets the amount betted by the latest all-in
 *
 * @param lineup
 * @returns amount of last all-in
 */
const maxAllIn = (lineup, rc) => lineup.reduce((maxBet, seat) => {
  if (seat.sitout && seat.sitout === 'allin') {
    const amount = seat.last ? rc.get(seat.last).amount.toNumber() : 0;
    if (amount > maxBet) {
      return amount;
    }
  }

  return maxBet;
}, 0);

export default class PokerHelper {
  constructor(receiptCache) {
    this.rc = (receiptCache) || new ReceiptCache();
  }

  // ########## SEAT STATE HELPERS ##########

  /**
   * isActivePlayer
   *
   * @param
   * @returns
   */
  isActivePlayer(lineup, pos, state) {
    if (typeof pos === 'undefined' || !lineup) {
      throw new Error('lineup undefined');
    }
    if (pos < 0 || pos >= lineup.length || lineup.length < 2) {
      throw new Error(`bad param pos: ${pos}`);
    }
    // TODO: pass correct hand state
    return isActive(lineup[pos], state, this.rc);
  }

  /**
   * inLineup
   *
   * @param
   * @returns
   */
  inLineup(signer, lineup) {
    return lineup.findIndex(seat => seat.address === signer);
  }

  /**
   * getMyMaxBet
   *
   * @param
   * @returns
   */
  getMyMaxBet(lineup, address) {
    if (!lineup || !address) {
      throw new Error('invalid params.');
    }
    const myPos = this.getMyPos(lineup, address);
    if (myPos < 0) {
      throw new Error(`address ${address} not in lineup.`);
    }
    const receipt = (lineup[myPos].last) ? this.rc.get(lineup[myPos].last) : undefined;
    return (receipt) ? receipt.amount.toNumber() : 0;
  }


  /**
   * getMyPos
   *
   * @param
   * @returns
   */
  getMyPos(lineup, address) {
    for (let i = 0; i < lineup.length; i += 1) {
      if (lineup[i].address === address) {
        return i;
      }
    }
    throw new Error(`pos of ${address} not found.`);
  }


  // ########## LINEUP STATE HELPERS ##########

  /**
   * findMinRaiseAmount
   *
   * @param
   * @returns
   */
  findMinRaiseAmount(lineup, dealer, lastRoundMaxBet, state) {
    if (!lineup || dealer === undefined) {
      throw new Error('invalid params.');
    }
    const lastRoundMaxBetInt = parseInt(lastRoundMaxBet, 10);
    // TODO: pass correct state
    const max = this.getMaxBet(lineup, state);
    if (max.amount === lastRoundMaxBetInt) {
      throw new Error('can not find minRaiseAmount.');
    }
    // finding second highest bet
    let secondMax = lastRoundMaxBetInt;
    for (let i = max.pos + 1; i < lineup.length + max.pos; i += 1) {
      const pos = i % lineup.length;
      const last = (lineup[pos].last) ? this.rc.get(lineup[pos].last).amount.toNumber() : 0;
      if (last > secondMax && last < max.amount) {
        secondMax = last;
      }
    }
    return max.amount - secondMax;
  }

  /**
   * getMaxBet
   *
   * @param
   * @returns
   */
  getMaxBet(lineup, state) {
    const startPos = (state === 'preflop' && lineup.length > 2) ? 2 : 0;
    const seats = [
      ...lineup.slice(startPos, lineup.length),
      ...lineup.slice(0, startPos),
    ];

    const result = seats.reduce((memo, seat, i) => {
      if (!seat.last) {
        return memo;
      }
      const last = this.rc.get(seat.last);
      const amount = last.type !== Type.SIT_OUT ? last.amount.toNumber() : 0;
      // if we are in dealing the last 0 bet is the max bet
      if (amount >= memo.amount || (amount === 0 && state === 'dealing')) {
        return { amount, pos: (i + startPos) % lineup.length };
      }

      return memo;
    }, { pos: -1, amount: 0 });

    if (result.pos === -1) {
      throw new Error('could not find max bet.');
    }

    return result;
  }

  /**
   * calculatePotsize
   *
   * @param
   * @returns
   */
  calculatePotsize(lineup) {
    return lineup.reduce((potSize, seat) => {
      const receipt = (seat.last) ? this.rc.get(seat.last) : undefined;
      return potSize + (receipt ? receipt.amount.toNumber() : 0);
    }, 0);
  }

  /**
   * isTurn
   *
   * @param
   * @returns
   */
  isTurn(lineup, dealer, state, bbAmount, addr) {
    const pos = this.getMyPos(lineup, addr);
    return this.getWhosTurn(lineup, dealer, state, bbAmount) === pos;
  }

  /**
   * getWhosTurn
   *
   * @param
   * @returns
   */
  getWhosTurn(lineup, dealer, state, bbAmount) {
    if (this.isHandComplete(lineup, dealer, state)) {
      throw new Error('no ones turn if hand complete.');
    }
    const activePlayers = activeLineup(lineup, dealer, state, this.rc);
    let maxBet;

    if (state !== 'waiting') {
      maxBet = this.getMaxBet(activePlayers, state);
      if (!evenLineup(activePlayers, this.rc)) {
        // if betting amounts are not even return next player of to the maxBettor
        const next = activePlayers[(maxBet.pos + 1) % activePlayers.length];
        const last = this.rc.get(next.last);
        if (last && last.amount.toNumber() === maxBet.amount) {
          next.pos = nextActive(lineup, next.pos + 1, state, this.rc);
        }
        return next.pos;
      }
    }
    const stateChecksMap = {
      preflop: Type.CHECK_PRE,
      flop: Type.CHECK_FLOP,
      turn: Type.CHECK_TURN,
      river: Type.CHECK_RIVER,
    };
    const checkType = stateChecksMap[state] || 0;
    const checker = findLatest({ sorted: true, lineup: activePlayers }, checkType, this.rc);
    if (checker.last) {
      return activePlayers[(checker.pos + 1) % activePlayers.length].pos;
    }

    if (state === 'preflop') {
      if (!bbAmount) throw new Error('BB amount cannot be undefined');
      if (!maxBet) {
        maxBet = this.getMaxBet(activePlayers, state);
      }
      const maxAllInAmount = maxAllIn(lineup, this.rc);
      const maxAmount = (maxAllInAmount > maxBet.amount) ? maxAllInAmount : maxBet.amount;
      if (maxAmount === parseInt(bbAmount, 10)) {
        return this.getBbPos(lineup, dealer, state);
      }
    }

    if (activePlayers.length === 2 && state === 'waiting') {
      return activePlayers[1].pos;
    }

    return activePlayers[0].pos;
  }

  /**
   * nextPlayer
   *
   * @param
   * @returns
   */
  nextPlayer(lineup, startPos, type, state) {
    return findNextPlayer(lineup, startPos, type, state, this.rc);
  }

  /**
   * getSbPos
   *
   * @param
   * @returns
   */
  getSbPos(lineup, dealer, state) {
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
  }

  /**
   * getBbPos
   *
   * @param
   * @returns
   */
  getBbPos(lineup, dealer, state) {
    return findBbPos(lineup, dealer, state, this.rc);
  }


  // ########### COUNTS ###############

  /**
   * countActivePlayers counts the active players in lineup
   * used in oracle
   *
   * @param lineup
   * @returns number of active players
   */
  countActivePlayers(lineup, state) {
    return lineup.filter((_, pos) => this.isActivePlayer(lineup, pos, state)).length;
  }

  /**
   * countAllIn counts the number of players that are allin
   * for countAllIns
   *
   * @param lineup
   * @returns number of all-in players
   */
  countAllIn(lineup) {
    if (!lineup) {
      throw new Error('invalid lineup');
    }
    return lineup.filter(seat => seat.sitout && seat.sitout === 'allin').length;
  }

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
  isBettingDone(lineup, dealer, state, bbAmount) {
    if (this.isHandComplete(lineup, dealer, state)) {
      return true;
    }
    const activePlayers = activeLineup(lineup, dealer, state, this.rc);
    let maxBet;
    if (state === 'waiting' || state === 'preflop') {
      try {
        maxBet = this.getMaxBet(activePlayers, state);
      } catch (err) {
        if (state === 'waiting') {
          return false;
        }
        // try with all players, in case everyone all-in
        maxBet = this.getMaxBet(lineup, state);
      }
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

    const allInPlayerCount = this.countAllIn(lineup);
    if (allInPlayerCount > 0 && activePlayers.length === 1) {
      // see if last active player matched latest all-in
      const maxAllInAmount = maxAllIn(lineup, this.rc);
      if (!maxBet) {
        maxBet = this.getMaxBet(activePlayers, state);
      }
      return (maxAllInAmount <= maxBet.amount);
    }

    const allEven = evenLineup(activePlayers, this.rc);
    if (!allEven) {
      return false;
    }

    const checker = findLatest({ sorted: true, lineup: activePlayers }, Type.CHECK_PRE, this.rc);
    if (checker.last) {
      // prefop betting done if check found
      if (state === 'preflop') {
        return true;
      }
      // on other streets wait until all active players have checked
      const checkType = (state === 'preflop') ? // eslint-disable-line
        Type.CHECK_PRE : (state === 'flop') ? // eslint-disable-line
          Type.CHECK_FLOP : (state === 'turn') ?
            Type.CHECK_TURN : Type.CHECK_RIVER;
      const checkCount = countReceipts(lineup, checkType, this.rc);
      if (checkCount === activePlayers.length) {
        return true;
      }
      return false;
    }
    if (state === 'preflop') {
      if (!bbAmount) throw new Error('BB amount cannot be undefined');
      const bbPos = this.getBbPos(lineup, dealer, state);
      const bbRec = this.rc.get(lineup[bbPos].last);
      if (isActive(lineup[bbPos], state, this.rc) &&
        bbRec.type !== Type.CHECK_PRE &&
        maxBet.amount === parseInt(bbAmount, 10)) {
        return false;
      }
    }
    if (allInPlayerCount > 0 && activePlayers.length === 0) {
      return true;
    }
    if (allEven) {
      return true;
    }
    throw Error('could not determine betting state');
  }

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
  isHandComplete(lineup, dealer, state) {
    const activePlayers = activeLineup(lineup, dealer, state, this.rc);
    const allInPlayerCount = this.countAllIn(lineup);
    if (state === 'showdown') {
      if (checkForReceipt(lineup, Type.SHOW, this.rc)) {
        return (activePlayers.length === 0 && allInPlayerCount === 0);
      }
      return (activePlayers.length <= 1 && allInPlayerCount === 0);
    }
    return (
      (activePlayers.length <= 1 && allInPlayerCount === 0) ||
      (activePlayers.length === 0 && allInPlayerCount === 1)
    );
  }

  /**
   * renderHand
   *
   * @param
   * @returns
   */
  renderHand(handId, lineupParam, dealer,
    sb, state, changed, deck, preMaxBet, flopMaxBet, turnMaxBet, riverMaxBet,
    distribution, netting) {
    const lineup = lineupParam.slice();
    if (state === 'showdown') {
      for (let i = 0; i < lineup.length; i += 1) {
        if (lineup[i].last) {
          const last = this.rc.get(lineup[i].last);
          if (last.type === Type.SHOW) {
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
  }

  /**
   * user PokerSolver do determine winner.
   *
   * @param lineup
   * @param dealer
   * @param board
   * @returns winners array
   */
  getWinners(lineup, dealer, board) {
    if (!lineup) {
      throw new Error('invalid params');
    }
    const boardCards = board.map(c => VALUES[c % 13] + SUITS[Math.floor([c / 13])]);
    const winners = [];
    const players = [];
    Solver.Hand.winners(lineup.filter(obj => obj.cards).map((player) => {
      const pHand = [];
      const card1 = VALUES[player.cards[0] % 13] + SUITS[Math.floor([player.cards[0] / 13])];
      const card2 = VALUES[player.cards[1] % 13] + SUITS[Math.floor([player.cards[1] / 13])];
      pHand.push(...boardCards, card1, card2);
      const handObj = Solver.Hand.solve(pHand);
      players.push(Object.assign(player, { hand: handObj }));
      return handObj;
    })).forEach((wHand) => {
      players.forEach((player) => {
        if (player.hand === wHand) {
          const winner = {
            addr: player.address,
            hand: player.hand.descr,
          };
          winners.push(winner);
        }
      });
    });

    return winners;
  }

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
  calcDistribution(lineup, state, boardCards, rakePerMil, rakeAddr) {
    if (!state || !lineup) {
      throw new Error('invalid params');
    }

    // create pots
    const players = getPlayers(this, state, lineup);
    const pots = players.filter(p => p.active).reduce((list, player) => {
      if (!list.includes(player.amount)) {
        return [...list, player.amount];
      }

      return list;
    }, []).sort((a, b) => a - b);

    if (pots.reduce((a, b) => a + b, 0) === 0) {
      // zero pots, can't be distributed
      // return money to players
      return players.reduce((result, player) => ({
        ...result,
        [lineup[player.pos].address]: player.amount,
      }), { [rakeAddr]: 0 });
    }

    const evals = pots.map(pot => ({
      limit: pot,
      size: 0,
      chal: [],
      winners: [],
    }));

    // distribute players on evals
    // while all players amounts is not distributed
    while (players.filter(p => p.amount > 0).length > 0) {
      for (let i = 0; i < evals.length; i += 1) {
        for (let j = 0; j < players.length; j += 1) {
          if (players[j].amount > 0) {
            const limit = (i > 0) ? evals[i].limit - evals[i - 1].limit : evals[i].limit;
            const contribution = Math.min(limit, players[j].amount);
            evals[i].size += contribution;
            players[j].amount -= contribution;
            if (players[j].active) {
              evals[i].chal.push(players[j].pos);
            }
          }
        }
      }
    }

    // solve hands
    for (let i = 0; i < evals.length; i += 1) {
      if (evals[i].chal.length > 1) {
        const hands = [];
        for (let j = 0; j < evals[i].chal.length; j += 1) {
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
        for (let j = 0; j < wnrs.length; j += 1) {
          const pos = evals[i].chal[hands.indexOf(wnrs[j])];
          evals[i].winners.push(pos);
        }
      } else {
        evals[i].winners.push(evals[i].chal[0]);
      }
    }

    // sum up pots by players and calc rake
    const winners = {};
    for (let i = 0; i < evals.length; i += 1) {
      let total = evals[i].size;
      for (let j = 0; j < evals[i].winners.length; j += 1) {
        const addr = lineup[evals[i].winners[j]].address;
        if (!winners[addr]) {
          winners[addr] = 0;
        }
        const share = Math.floor((evals[i].size - (
          (evals[i].size / 1000) * rakePerMil)) / evals[i].winners.length);
        total -= share;
        winners[addr] += share;
      }
      if (!winners[rakeAddr]) {
        winners[rakeAddr] = 0;
      }
      winners[rakeAddr] += total;
    }
    return winners;
  }

}
