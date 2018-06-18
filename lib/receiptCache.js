
/**
 * Copyright (c) 2017-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU Affero General Public License,
 * version 3, found in the LICENSE file in the root directory of this source 
 * tree.
 */

import Receipt from './receipt';

function ReceiptCache() {
  this.cache = {};
}


ReceiptCache.prototype.get = function get(receipt) {
  if (!receipt) { return null; }
  if (this.cache[receipt]) { return this.cache[receipt]; }
  this.cache[receipt] = Receipt.parse(receipt);
  return this.cache[receipt];
};

module.exports = ReceiptCache;
