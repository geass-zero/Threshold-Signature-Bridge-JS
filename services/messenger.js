var Web3 = require('web3');
var mongoose = require('mongoose')
var Port = require("../contractABIs/EVMPort.json")
var ValidatorSchema = require('../models/validators')
var TransactionsSchema = require('../models/transactions')
var OrderSchema = require('../models/order')
var runMode = require('../config/'+('development')+'.js')
const axios = require('axios');
var networking = require("./networking")
var signer = require("./signer")



function addValidatorForGenesis(req) {
    console.log('Attempting to add node');
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    console.log('Password accetped');
    ValidatorSchema.find({}, function(err, allValidators) {
        console.log('Current Validator Count: ' + allValidators.length);
        if (allValidators.length == runMode.currentPartyCount) {
            return;
        }
        for (let i = 0; i < allValidators.length; i++) {
            if (allValidators[i].moniker == req.body.moniker) {
                return;
            }
        }
        // if (allValidators.length > 0) {return}
        ValidatorSchema.findOneAndUpdate({moniker: req.body.moniker}, {
            nodeOrder: allValidators.length,
            moniker: req.body.moniker,
            pubKey: '',
            lastPingTime: Date.now(),
            IP: req.body.IP
        }, {upsert: true, new: true}, function(err, result) {
            console.log('Validator added: ', req.body.moniker);
            console.log('Validator IP: ', req.body.IP);
            ValidatorSchema.find({}, function(err,validators) {
                if (runMode.isGenesis && validators ) {
                    console.log('Current validator count is ', validators.length);
                    console.log('Current maxPartySize is ', runMode.currentPartyCount);
                    if (validators.length == runMode.currentPartyCount) {
                        OrderSchema.findOne({}, function(err, initialOrder) {
                            initialOrder.timeSinceSwitch = Date.now();
                            orderHeight = 0;
                            console.log('Party full. Now informing all validators.')
                            //send validator list to all parties
                            
                            for(var i = 0; i < validators.length; i++) {
                                if (validators[i].IP !== runMode.genesisIP) {
                                    
                                    axios.post(validators[i].IP + '/validator/add-validators-from-genesis', {
                                        validators,
                                        currentPartyCount: runMode.currentPartyCount,
                                        order: initialOrder,
                                        partyPassword: runMode.partyPassword
                                    }).then((result) => {

                                    }).catch((err) => {
                                        console.log('Error informing Node: ' + validators[i].moniker);
                                    })
                                }
                            }
                        })
                        
                        networking.startListening();
                    }
                    
                }
                
                
            })
        })
        
       
        
    })
     
}

function addValidatorsFromGenesis(req) {
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    console.log('Party now full. Saving all other validators.')
    OrderSchema.findOneAndUpdate({}, {
        currentNode: req.body.order.currentNode,
        orderHeight: req.body.order.orderHeight,
        timeSinceSwitch: req.body.order.timeSinceSwitch
    }, {
        new: true,
        upsert: true
    }, function(err, result) {
        var validators = req.body.validators;
        for(var i = 0; i < validators.length; i++) {
            ValidatorSchema.findOneAndUpdate({moniker: validators[i].moniker}, {
                nodeOrder: validators[i].nodeOrder,
                id: validators[i].id,
                moniker: validators[i].moniker,
                pubKey: '',
                lastPingTime: Date.now(),
                IP: validators[i].IP
            }, {
                new: true,
                upsert: true
            }, function(err, savedTransaction) {

            });
            
        }
        runMode.currentPartyCount = req.body.currentPartyCount;
        runMode.partyCreated = true;
        //start listeners
        networking.startListening()
    })
}

function getValidatorIPs(req, res) {
    ValidatorSchema.find({}, function(err, validators) {
        let IPs = [];
        let monikers = [];
        for (let i = 0; i < validators.length; i++) {
            IPs.push(validators[i].IP);
            monikers.push(validators[i].moniker);
        }
        return res.status(200).json({
            IPs, 
            monikers
        });
    })
}

function sendSyncTransactionData(req, res) {
    //fetch all unconfirmed transactions and send to requesting node via url
    TransactionsSchema.find({confirmed: false}, function(err, transactions) {
        return res.status(200).json(transactions);
    })
}

function updateOrderIDs(req, res) {
    ValidatorSchema.find({}, function(err, validators) {
        if (validators.length < runMode.currentPartyCount) {
            //res.send error
            return res.status(200).send({
                
            })
        }

        //require that the sender is the currentNode

        //for each new orderID, check that the orderID for the transaction is 0
        for (var i = 0; i < req.body.transactions.length; i++) {
            console.log(req.body.transactions[i])
            if (req.body.transactions[i] && req.body.transactions[i].hash && req.body.transactions[i].orderID) {
                TransactionsSchema.findOne({hash: req.body.transactions[i].hash}, function(err, transaction) {
                    if (transaction && transaction.hash && req.body.transactions[i]) {
                        console.log('Updating Transaction hash: '+ transaction.hash)
                        transaction.orderID = req.body.transactions[i].orderID;
                        transaction.save();
                    } else {
                        console.log('Could not update Order ID of transaction hash: ')
                    }
                })
            }
        }

        //update orderHeight to new orderHeight
        OrderSchema.findOne({}, function (err, order) {
            order.orderHeight = req.body.order.orderHeight;
            order.currentNode = req.body.order.currentNode;
            if (order.currentNode >= runMode.currentPartyCount) {
                order.currentNode = 0;
            }
            order.timeSinceSwitch = req.body.order.timeSinceSwitch;
            order.save();
        })
    })
    
    
}

async function updateTransactionMonikers(req) {
    console.log('Updating monikers of delayed transactions')
    var newTransactions = req.body.transactions;
    if (newTransactions.length < 1) {
        console.log('No monikers to update');
        return;
    }
    c = await Promise.all(newTransactions.map(transaction => {
        TransactionsSchema.findOneAndUpdate({hash: transaction.hash}, {
            moniker: transaction.moniker
        }, {new: true, upsert: true}, function(err, result) {

        })
      })).then(()=> {}).catch((err) => {
        console.log('Error updating one or more delayed transaction monikers');
    })

    

}

async function updateConfirmationStatus(req, res) {
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    ValidatorSchema.find({}, function(err, validators) {
        if (validators.length < runMode.currentPartyCount) {
            //res.send error
            return res.status(200).send({
                
            })
        }

        //require that the sender is the assigned moniker

        console.log('Updating transaction confirmation statuses');
        //update transaction to confirmed.
        var newTransactions = req.body.transactions;
        if (newTransactions.length < 1) {
            console.log('No confirmations to update');
            return res.send(200);
        }
        Promise.all(newTransactions.map(transaction => {
            TransactionsSchema.findOneAndUpdate({hash: transaction.hash}, {
                endHash: transaction.endHash,
                confirmed: transaction.confirmed
            }, function(err, result) {
                return res.send(200);
            })
        })).then(()=> {}).catch((err) => {
            console.log('Error updating one or more transaction confirmation statuses');
            return res.send(400);
        })
    })
    

    
}

async function updateOrderMonikers(req, res) {
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    await Promise.all(req.body.transactions.map(transaction =>{
        TransactionsSchema.findOneAndUpdate({hash: transaction.hash}, transaction, {
            upsert:true,
            new:true
        }, function(err, result) {

        })
    })).then(() => {
        res.sendStatus(200);
    })
}


function syncTransactionData() {
    //get all validators(exclude self w/ moniker)
    ValidatorSchema.find({}, function(err, validators) {
        var transactionsSynced = false;
        for (var i = 0; i < validators.length; i++) {
            if (transactionsSynced) {return}
            axios.get(validators[i].IP + '/validator/send-sync').then(function(res) {
                if (res['transactions'].length > 0) {
                    for (var j = 0; j < res['transactions'].length; j++) {
                        //check transaction if hash does not exist
                        
                        //save new transaction

                    }
                }
                transactionsSynced = true;
            })
        }
    })
}

async function resync(req, res) {
    console.log('resyncing');
    //should have the correct partypassword
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    
    //return order, validators, and transactions
    OrderSchema.find({}, function(err, order) {
        ValidatorSchema.find({}, function(err, validators) {
            if (validators.length < runMode.currentPartyCount) {
                //res.send error
                return res.status(200).send({
                    
                })
            }
            res.status(200).send({
                order,
                validators
            })
            //send transactions to transaction receiver
            TransactionsSchema.find({}, function(err, transactions) {
                axios.post(runMode.genesisIP + '/validator/transactions', {
                    partyPassword: runMode.partyPassword,
                    transactions
                })
            });
        })
    })
    
}

async function transactionSyncReciever(req, res) {
    //should have the correct partypassword
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }

    //save transactions with a mapping
    await Promise.all(req.body.transactions.map(transaction => {
        TransactionsSchema.findOneAndUpdate({hash: transaction.hash}, transaction, {new:true,upsert:true}, function(err, saveRes) {

        })
    })).then(() => {
        res.sendStatus(200);
    }).catch(() => {

    })
}



// //function to add new validator
function addValidator (validator) {
    
    //require that caller IP is in approved list
    var isApproved = false;
    for (var i = 0; i < runMode.approvedValidatorIPs.length; i++) {
        if (validator.IP == runMode.approvedValidatorIPs[i]) {
            isApproved = true;
        }
    }
    //add a new validator
    if (isApproved) {
        var aValidator = new ValidatorSchema({
            id: validator._id,
            moniker: validator.moniker,
            pubKey: '',
            lastPingTime: validator.lastPingTime,
            IP: validator.IP
        })
        aValidator.save();
    }
}

async function getSwapFee(req, res) {
    var web3;
    var contract;
    var feeInCoin = 0;
    console.log('Getting fee');
    switch(req.query.startChain) {
        case 'BSC':
            web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[0]);
            //call port contract determineFeeInCoinFunction
            await contract.methods.determineFeeInCoin(req.query.endChain).call().then((feeInCoin) => {
                console.log(feeInCoin);
                res.status(200).json({
                    status: 'success',
                    estimatedGas: 0,
                    gasPrice: web3.eth.getGasPrice(),
                    totalCoinCost: (feeInCoin)
                });
              })
          break;
        case 'ETH':
            web3 = new Web3(new Web3.providers.HttpProvider('https://eth.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[1]);
            await contract.methods.determineFeeInCoin(req.query.endChain).call().then((feeInCoin) => {
                console.log(feeInCoin);
                res.status(200).json({
                    status: 'success',
                    estimatedGas: 0,
                    gasPrice: web3.eth.getGasPrice(),
                    totalCoinCost: (feeInCoin)
                });
              })
          break;
        case 'HECO':
          web3 = new Web3(new Web3.providers.HttpProvider('https://heco.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
          contract = new web3.eth.Contract(Port.abi, runMode.portContracts[2]);
          await contract.methods.determineFeeInCoin(req.query.endChain).call().then((feeInCoin) => {
            console.log(feeInCoin);
            res.status(200).json({
                status: 'success',
                estimatedGas: 0,
                gasPrice: web3.eth.getGasPrice(),
                totalCoinCost: (feeInCoin)
            });
          })
          
          break;
    }
    
    // web3.eth.getGasPrice(function(error, result) {
    //     var gasPriceInGwei = web3.utils.fromWei(result, 'gwei');
    //     contract.methods.inboundSwap(
    //         req.query.startChain, 
    //         req.query.sender,
    //         req.query.recipient,
    //         req.query.destination,
    //         new web3.utils.BN(req.query.amount.toString()))
    //             .estimateGas(
    //                 {
    //                     from: process.env.TESTNET_PUBLIC_KEY,
    //                     gasPrice: gasPriceInGwei
    //                 }, function(error, estimatedGas) {
    //                     if (!error) {
    //                         res.status(200).json({
    //                             status: 'success',
    //                             estimatedGas,
    //                             gasPrice: web3.eth.getGasPrice(),
    //                             totalCoinCost: (parseInt(gasPrice * estimatedGas, 10) + parseInt(feeInCoin, 10))
    //                         });
    //                     } else {
    //                         res.status(500).json({
    //                             status: 'failed',
    //                             error
    //                         });
    //                     }
    //                 }
    //             );
    // });
    

}

function recieveSignedMessage(req) {
    if (runMode.partyPassword !== req.body.partyPassword) {
        return;
    }
    console.log('Receiving Transaction: '+ req.body.transaction.hash);
    TransactionsSchema.findOne({hash: req.body.transaction.hash}, function(err, transaction) {
        if (transaction) {
            let hasSigned = false;
            for (let i = 0; i < transaction.signers.length; i++) {
                if (transaction.signers[i] == req.body.moniker) {
                    hasSigned = true;
                }
            }


            if (!hasSigned) {
                transaction.signers.push(req.body.moniker);
                console.log(transaction);
                for (let i = 0; i < req.body.transaction.v.length; i++) {

                    let hasR = false;
                    let hasS = false;
                    console.log('s Value: ' + req.body.transaction.s[i]);
                    for (let j = 0; j < transaction.v.length; j++) {
                        if (req.body.transaction.r[i] == transaction.r[j]) {
                            hasR = true;
                        }
                        if (req.body.transaction.s[i] == transaction.s[j]) {
                            hasS = true;
                        }
                    }
                    if (!hasR) {
                        transaction.v.push(req.body.transaction.v[i]);
                        transaction.r.push(req.body.transaction.r[i]);
                        transaction.s.push(req.body.transaction.s[i]);
                        transaction.h.push(req.body.transaction.h[i]);
                        transaction.signedCount = transaction.signedCount+1;
                    } else {
                        console.log('Has Duplicate: ' + req.body.moniker);
                    }
                }
                
            }
            if (transaction.endHash == "") {
                transaction.endHash = req.body.transaction.endHash;
            }
            transaction.save();
        } else {
            var newTransaction = new TransactionsSchema({
                orderID: 0,
                detectionTime: Date.now(),
                hash: req.body.transaction.hash,
                endHash: '',
                blockNumber: req.body.transaction.blockNumber,
                logIndex: req.body.transaction.logIndex,
                event: req.body.transaction.eventName,
                sender: req.body.transaction.sender,
                recipient: req.body.transaction.recipient,
                destination: req.body.transaction.destination,
                amount: req.body.transaction.amount,
                moniker: req.body.transaction.moniker,
                startChainIndex: req.body.transaction.startChainIndex,
                startChain: req.body.transaction.startChain,
                endChain: req.body.transaction.endChain,
                signedCount: 1,
                signers: [req.body.moniker],
                r: req.body.transaction.r,
                s:req.body.transaction.s,
                v:req.body.transaction.v,
                h:req.body.transaction.h,
                confirmed: false
            });
            newTransaction.save();
            signer.signMessage(newTransaction);
        }

    })
}


// //function to send request for signing
// async function requestSigning (req, res) {
//     //send message to all validators
// }

// //call signer on successful signing round
// async function finalizeTransaction (req, res) {
//     //assigned validator should send send to receiving chain
// }

module.exports = {
    addValidator,
    addValidatorForGenesis,
    addValidatorsFromGenesis,
    recieveSignedMessage,
    sendSyncTransactionData,
    syncTransactionData,
    resync,
    updateOrderIDs,
    updateTransactionMonikers,
    updateConfirmationStatus,
    transactionSyncReciever,
    getSwapFee,
    getValidatorIPs
}