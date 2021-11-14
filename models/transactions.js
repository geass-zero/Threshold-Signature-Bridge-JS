var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TransactionsSchema = new Schema({
    orderID: {type: Number},
    orderIDVotes: [],
    detectionTime: {type: Date},
    hash: {type: String, required: true},
    endHash: {type: String},
    blockNumber: {type: Number},
    logIndex: {type: Number},
    event: {type: String},
    sender: {type: String},
    addresses: [],
    uint256: [],
    string: [],
    bool: [],
    bytes: [],
    feeAmount: {type: String},
    moniker: {type: String, required: true},
    startChain: {type: String},
    startChainIndex: {type: Number},
    destination: {type: String},
    endChain: {type: String},
    signedCount: {type: Number},
    signers: [{type: String}],
    r: [],
    s: [],
    v: [],
    h: [],
    confirmed: {type: Boolean}
});

module.exports = mongoose.model('Transactions', TransactionsSchema);
