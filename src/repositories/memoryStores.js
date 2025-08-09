// In-memory stores (simple implementation). Replace with DB-backed repositories later.

const advertisers = new Map();
const campaigns = new Map();
const topups = [];
const otherSpends = [];

module.exports = { advertisers, campaigns, topups, otherSpends };
