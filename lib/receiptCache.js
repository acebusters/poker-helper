import EWT from 'ethereum-web-token';

function ReceiptCache() {
  this.cache = {};
}


ReceiptCache.prototype.get = function get(receipt) {
  if (!receipt) { return null; }
  if (this.cache[receipt]) { return this.cache[receipt]; }
  this.cache[receipt] = EWT.parse(receipt);
  return this.cache[receipt];
};

module.exports = ReceiptCache;
