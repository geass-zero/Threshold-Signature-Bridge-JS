var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ValidatorSchema = new Schema({
  nodeOrder: {type: Number},
  moniker: {type: String, unique: true},
  pubKey: {type: String},
  lastPingTime: {type: Number},
  IP: {type: String, unique: true}
});

module.exports = mongoose.model('Validators', ValidatorSchema);