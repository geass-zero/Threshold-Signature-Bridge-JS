var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var OrderSchema = new Schema({
    currentNode: {type: Number},
    orderHeight: {type: Number},
    timeSinceSwitch: {type: Date}
});

module.exports = mongoose.model('Order', OrderSchema);
