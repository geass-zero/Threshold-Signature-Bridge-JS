const express = require('express')
var app = express.Router()
var TransactionSchema = require('../models/transactions')
var Messenger = require('../services/messenger')

app.get('/:id', async (req, res) => {

    var skip = 0 || req.query.skip;
    var userAddress = req.params.id;
    var orderID = '' || req.query.orderid;
    const query = {};
    if (userAddress !== '') {
        query['sender'] = userAddress;
    }
    TransactionSchema.count({sender: userAddress}, function(err, count){
        console.log('User transaction count: '+ count);
        if (skip > count) {skip = 0}
        TransactionSchema.find({sender: userAddress})
            .sort({'date': -1})
            .skip(skip)
            .limit(50)  
            .exec(function(err, results) {
                res.status(200).json({
                    status: 'success',
                    count,
                    transactions: results
                });
            });
    });
    
});


module.exports = app