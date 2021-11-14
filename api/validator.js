const express = require('express')
var app = express.Router()
var ValidatorSchema = require('../models/validators')
var Messenger = require('../services/messenger')

app.get('/', function(req, res) {
    Messenger.getValidatorIPs(req, res);
})

// app.get('/get-validators', async (req, res) => {
//     const validators = await ValidatorSchema.find({})
//     res.send(validators);
// });

app.post('/add-validator-for-genesis', function (req, res) {
    Messenger.addValidatorForGenesis(req);
    res.sendStatus(200);
});

app.post('/add-validators-from-genesis', function (req, res) {
    Messenger.addValidatorsFromGenesis(req);
    res.sendStatus(200);
});

app.post('/update-transaction', function (req, res) {
    Messenger.recieveSignedMessage(req);
    res.sendStatus(200); 
})

app.post('/sync', function (req, res) {
    Messenger.sendSyncTransactionData(req, res);
    
})

app.post('/resync', function (req, res) {
    Messenger.resync(req, res);
})

app.post('/transactions', function (req, res) {
    Messenger.transactionSyncReciever(req, res);
})

app.post('/order-ids', function (req, res) {
    Messenger.updateOrderIDs(req, res);
    // res.sendStatus(200);
})

app.post('/order-delay', function (req, res) {
    Messenger.updateOrderMonikers(req, res);
})

app.post('/confirm', function (req, res) {
    Messenger.updateConfirmationStatus(req, res);
})

app.get('/gas', function (req, res) {
    Messenger.getSwapFee(req, res);
})




module.exports = app