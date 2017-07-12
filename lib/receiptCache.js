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
