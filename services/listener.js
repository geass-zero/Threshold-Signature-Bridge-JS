//run a listener for each supported chain(ETH, BSC)
var Web3 = require('web3');
var runMode = require('../config/'+('development')+'.js')
var signer = require("./signer")
const axios = require('axios');
//var messenger = require("./messenger")
var Port = require("../contractABIs/EVMPort.json")
var TransactionsSchema = require('../models/transactions')
var ValidatorSchema = require('../models/validators')
var OrderSchema = require('../models/order')
const path = require('path');
const validators = require('../models/validators');
const { rejects } = require('assert');
require("dotenv").config({path: path.resolve(__dirname, `../config/.env`)})

// if (typeof web3 !== 'undefined') {
//     web3 = new Web3(web3.currentProvider);
//   } else {
//     // set the provider you want from Web3.providers
//     web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
//   }

  function startListeners() {
    let chains = runMode.Chains;
    console.log("Starting Websocket listeners on BSC, ETH, and HECO");
    let contractABI = Port.abi;
    for(let i = 0; i < chains.length; i++) {
      if (runMode.mode == "production") {
        switch (i) {
          case 0:
            BSCListener(contractABI, runMode.portContracts[i], i)
            break;
          case 1:
            ETHListener(contractABI, runMode.portContracts[i], i)
            break;
          case 2:
            HECOListener(contractABI, runMode.portContracts[i], i)
            break;
        }
      } else {
        switch (i) {
          case 0:
            BSCListener(contractABI, runMode.testPortContracts[i], i)
            break;
          case 1:
            ETHListener(contractABI, runMode.testPortContracts[i], i)
            break;
          case 2:
            HECOListener(contractABI, runMode.testPortContracts[i], i)
            break;
        }
      }
    }
  }

  function BSCListener(contractABI, contractAddress, index) {
    var web3socket;
    if (runMode.mode == "production") {
      console.log(process.env.QUICKNODE_WSS);
      web3socket = new Web3(new Web3.providers.WebsocketProvider(process.env.QUICKNODE_WSS));
    } else {
      web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://bsc.getblock.io/testnet/?api_key="+process.env.GETBLOCK_API_KEY)); 
    }
    var Contract = new web3socket.eth.Contract(contractABI, contractAddress);
    var ContractFallback = new web3socket.eth.Contract(contractABI, contractAddress);
    const subscription = web3socket.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
      if (error) return console.error(error);
      
      console.log('Still Listening to BSC!');
    }).on('data', (blockHeader) => {
     
    });
    Contract.events.allEvents()
        .on('data', (event) => {
            saveEVMEvent(event, 'BSC', index)
        })
        .on('error', console.error);
    
    EVMPastEventListener('BSC', contractABI, contractAddress);
  }

  function ETHListener(contractABI, contractAddress, index) {
    var web3socket;
    if (runMode.mode == "production") {
      web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://mainnet.infura.io/ws/v3/"+process.env.INFURA_API_KEY));
    } else {
      web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://ropsten.infura.io/ws/v3/"+process.env.INFURA_API_KEY));
    }
    var Contract = new web3socket.eth.Contract(contractABI, contractAddress);
    const subscription = web3socket.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
      if (error) return console.error(error);
      
      console.log('Still Listening to ETH!');
    }).on('data', (blockHeader) => {
     
    });
    Contract.events.allEvents()
        .on('data', (event) => {
          console.log(event)
            saveEVMEvent(event, 'ETH', index)
        })
        .on('error', console.error);

    EVMPastEventListener('ETH', contractABI, contractAddress);
  }

  function HECOListener(contractABI, contractAddress, index) {
    var web3socket;
    if (runMode.mode == "production") {
      web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://ws-mainnet-node.huobichain.com"));
      //web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://heco.getblock.io/mainnet/?api_key="+process.env.GETBLOCK_API_KEY));;
    } else {
      web3socket = new Web3(new Web3.providers.WebsocketProvider("wss://ws-testnet.hecochain.com")); 
    }
    var Contract = new web3socket.eth.Contract(contractABI, contractAddress);
    
    const subscription = web3socket.eth.subscribe('newBlockHeaders', (error, blockHeader) => {
      if (error) return console.error(error);
      
      console.log('Still Listening to HECO!');
    }).on('data', (blockHeader) => {
     
    });

    Contract.events.allEvents()
        .on('data', (event) => {
            console.log(event);
            saveEVMEvent(event, 'HECO', index)
        })
        .on('error', console.error);

    EVMPastEventListener('HECO', contractABI, contractAddress);
  }

  async function EVMPastEventListener(chain, contractABI, contractAddress) {
    return await new Promise(resolve => {
      const interval = setInterval(async () => {
        let provider;
        switch (chain) {
          case 'BSC':
            provider = process.env.QUICKNODE_HTTPS;
            break;
          case 'ETH':
            provider = 'https://eth.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY;
            break;
          case 'HECO':
            provider = "https://http-mainnet-node.huobichain.com/";
            break;
        }
        web3 = new Web3(new Web3.providers.HttpProvider(provider));
        const contract1 = new web3.eth.Contract(contractABI, contractAddress);
        const latestBlock = await web3.eth.getBlockNumber()
        const START_BLOCK = parseInt(latestBlock) - parseInt(5000);
        const END_BLOCK = latestBlock;
        contract1.getPastEvents("BridgeSwapOut",
            {                               
                fromBlock: START_BLOCK,     
                toBlock: END_BLOCK // You can also specify 'latest'          
            })                              
        .then(events => {
          console.log('Now scanning past events for: '+ chain);
      
          for (let i = 0; i < events.length; i++) {
            TransactionsSchema.findOne({hash: events[i].transactionHash}, function(err, transaction) {
              if (!transaction) {
                console.log(events[i]);
                saveEVMEvent(events[i], chain, index)
              }
            })
          }

        })
        .catch((err) => console.error(err));
        // if (condition) {
        //   resolve('foo');
        //   clearInterval(interval);
        // };
      }, 10000);
    });
  }

  function sendSignedMessage(transaction) {
      ValidatorSchema.find({}, function(err, validators) {
          console.log('Attempting to notify other nodes of signing');
          for(var i = 0; i < validators.length; i++) {
              if (validators[i].moniker && validators[i].moniker !== runMode.moniker) {
                axios.post(validators[i].IP + '/validator/update-transaction', {
                  transaction,
                  moniker: runMode.moniker
                }).then(function() {

                }).catch(function() {
                  console.log('Error sending transaction to: ' + validators[i].moniker);
                })
              }
          }
      })
  } 

  function currentNodeDelayCheck() {
    const interval = setInterval(() => {
      OrderSchema.findOne({}, function(err, order) {
        if (Date.now() - order.timeSinceSwitch > 20000) {
          order.currentNode = order.currentNode + 1;
          if(order.currentNode-1 >= runMode.currentPartyCount) {
            order.currentNode = 0;
          }
          order.timeSinceSwitch = Date.now();
          order.save();


        }
      })
    }, 2000);
  }

  async function orderAssigner() {
    //set interval
    return await new Promise(resolve => {
      const interval = setInterval(() => {
       
        OrderSchema.findOne({}, function(err, order) {
          console.log('The current node is: ' + order.currentNode);
          ValidatorSchema.findOne({nodeOrder: order.currentNode}, function(err, validator) {
            //if currentNode == myNode 
            if(validator) {
              console.log(validator.moniker);
            }
            if (validator && validator.moniker == runMode.moniker) {
              console.log('Attempting to set Order IDs')
              
              //find unconfirmed transactions by oldest(max 10)
              TransactionsSchema.find({confirmed: true, orderID: 0}, function(err, transactions) {
        
                if (transactions.length > 0) {
                  for (let i = 0; i < transactions.length; i++) {
                    transactions[i].orderID = order.orderHeight+1;
                    updateTransactionID(order.orderHeight+1, transactions[i]);
                    order.orderHeight = order.orderHeight + 1;
                  }
                }
                
                order.currentNode = order.currentNode + 1;
                order.timeSinceSwitch = Date.now();
                if (order.currentNode-1 >= runMode.currentPartyCount) {
                  order.currentNode = 0;
                }
                order.save();
        
                //send transaction orders to all nodes
                console.log('Sending Order Height Update');
                console.log(transactions);
                sendOrderHeightUpdate(transactions, order);
              })
            }

            //orderDelayCheck();
          })
          
        })
        resolve(true);
        //clearInterval(interval);
      }, 5000);
    });
    
  }

  function sendOrderHeightUpdate(transactions, order) {
    ValidatorSchema.find({}, function(err, validators) {
      for (var i = 0; i < validators.length; i++) {
        if (validators[i].moniker !== runMode.moniker) {
          axios.post(validators[i].IP + '/validator/order-ids', {
            order,
            transactions
          }).then(() => {

          }).catch((err) => {
            console.log('Unable to send order height update to nodes');
          })
        }
      }
    })
  }

  function updateTransactionID(id, transaction) {
    TransactionsSchema.findOneAndUpdate({hash: transaction.hash}, {
      orderID: id
    }, {new:true}, function(err, res) {
      console.log('Updated Transaction hash:');
      console.log(res);
    });
  }

  function orderListener() {
    console.log('Starting order listener');
    //every 2 seconds, search for unconfirmed transactions(sort by oldest, limit 10)
    const interval = setInterval(() => {
      orderListenerHelper();
      orderListenerSigner();
    }, 2000)
  }


 function orderListenerSigner() {
    console.log('Searching for unsigned unconfirmed orders');
    TransactionsSchema.find({
      confirmed: false,
      moniker: runMode.moniker}, function(err, transactions) {
        if (transactions.length == 0) {
          return console.log('No outstanding unsigned orders');
        }
        
        async function setOrders() {
          //map transactions into a promise
          var updatedTransactions = [];
          await Promise.all(transactions.map(transaction => {
            
            if (!transaction.hash) {
              return;
            }
            for (let i = 0; i < transaction.signers.length; i++) {
              if (transaction.signers[i] == runMode.moniker) {
                return;
              }
            }
            transaction.signers.push(runMode.moniker);
            transaction.save();
            updatedTransactions.push(transaction);
          })).then(result => {
            for (let i = 0; i < updatedTransactions.length; i++) {
              if (updatedTransactions[i].hash) {
                sendSignedMessage(updatedTransactions[i]);
              }
              
            }
            
          }).catch(err => {
            console.log('Error updating one or more transactions');
          })

          
          
        }
        setOrders();
    })
 }

 function orderListenerHelper() {
    //if a transaction has node moniker, and threshold is met
      //send transaction to destination
      console.log('Searching for unconfirmed orders');
      TransactionsSchema.find({
        confirmed: false,
        moniker: runMode.moniker}, function(err, transactions) {
          if (transactions && transactions.length == 0) {
            return console.log('No outstanding unconfirmed orders');
          }
          
          async function setOrders() {
            //map transactions into a promise
            var updatedTransactions = [];
            await Promise.all(transactions.map(transaction => {
              if ((transaction.signers.length >= runMode.threshold)) {
                if (transaction.feeAmount) {
                  console.log(transaction.feeAmount);
                  //perform check to ensure that feeAmount > $30 + gas

                }
                console.log('Sending transaction');
                signer.useKey(transaction);
                transaction.confirmed = true;
                transaction.save();
                updatedTransactions.push(transaction);
              } else  {
                
              }
              
            })).then(result => {
              ValidatorSchema.find({}, function(err, validators) {
                //send transaction to all validators on promise return
                console.log('Sending confirmation statuses to other validators');
                for(let i = 0; i < validators.length; i++) {
                  if (validators[i].moniker !== runMode.moniker) {
                    axios.post(validators[i].IP + '/validator/confirm', {
                      transactions: updatedTransactions
                    }).then((result) => {
                      
                    }).catch((err) => {
                      console.log('Error informing node:' + validators[i].moniker)
                    })
                  }
                }
                
              })
                
            }).catch(err => {
              console.log('Error updating one or more transactions');
              console.log(err);
            })
          }
          setOrders();
      })
  }

  function orderDelayCheck() {
    //search for transactions with a blank endHash, and more than 2minutes old
    TransactionsSchema.find({endHash: ''}, function(err, transactions) {
      if (transactions.length == 0) {return};
      
      console.log('Looking for delayed orders');
      async function delayCheck() {
        //async loop through the transactions and assign monikers to self
        var updatedTransactions = [];
        await Promise.all(transactions.map(transaction => {
          transaction.moniker = runMode.moniker;
          transaction.save();
          updatedTransactions.push(transaction);
        })).then(result => {

          //send transaction to all validators on promise return
          console.log('Sending moniker update to other validators');
          ValidatorSchema.find({}, function(err, validators) {
            for(let i = 0; i < validators.length; i++) {
              if (validators[i].moniker !== runMode.moniker) {
                axios.post(validators[i].IP + '/validator/order-delay', {
                  transactions: updatedTransactions
                }).then(function() {
    
                }).catch((err) => {
                  console.log('Could not reach Node: ' + validators[i].moniker);
                })
              }
            }
          })

        }).catch(err => {
          console.log('Error updating one or more transactions');
          console.log(err);
        });

        
      }
      delayCheck();

    })
  }

  function saveEVMEvent(event, startChain, startChainIndex) {
    let eventName = event.event;
    console.log(eventName);
    
    if (eventName == 'BridgeSwapOut') {
        console.log("Swap event detected. Signing message.")
        TransactionsSchema.findOne({hash: event.transactionHash}, function(err, transaction) {
          if (transaction){
            //need function to create transaction
            
            signer.signMessage(transaction);
            transaction.signedCount = transaction.signedCount+1;
            transaction.feeAmount = event.returnValues['feeAmount'];
            let hasSigned = false;
            for (let i = 0; i < transaction.signers.length; i++) {
              if (transaction.signers[i] == runMode.moniker) {
                hasSigned = true;
              }
            }
            if (!hasSigned) {
              transaction.signers.push(runMode.moniker);
            }
            
            transaction.save();
            if (!transaction.hash) {
              console.log('Error: Detected transaction has no hash');
            }
            
            // if ((transaction.signedCount >= runMode.threshold) && (transaction.confirmed)) {
            //   //apply for approval
  
            //   //start signing process
            //   signer.useKey(transaction)
            // }
          } else {
            console.log('new transaction');
            let tempSign = [];
            tempSign.push(runMode.moniker);
            console.log(event.returnValues['preferredNode']);
            let newTransaction = new TransactionsSchema({
              orderID: 0,
              detectionTime: Date.now(),
              hash: event.transactionHash,
              endHash: '',
              blockNumber: event.blockNumber,
              logIndex: event.logIndex,
              event: event.eventName,
              sender: event.returnValues['sender'],
              destination: event.returnValues['destination'],
              addresses: event.returnValues['addresses'],
              uint256: event.returnValues['numbers'],
              string: event.returnValues['strings'],
              bool: event.returnValues['bools'],
              bytes: event.returnValues['bytes'],
              feeAmount: event.returnValues['feeAmount'],
              moniker: event.returnValues['preferredNode'],
              startChainIndex: startChainIndex,
              startChain: startChain,
              endChain: event.returnValues['endChain'],
              signedCount: 1,
              signers: [],
              r: [],
              s: [],
              v: [],
              h: [],
              confirmed: false
            });
            newTransaction.save().then(() => {
              signer.signMessage(newTransaction);
            })
            //move send message to actual signing function
            if (!newTransaction.hash) {
              console.log('Error: Detected transaction has no hash');
            }
            
            // if ((newTransaction.signedCount >= runMode.threshold) && (runMode.moniker == newTransaction.moniker)) {
            //   //apply for approval
  
            //   //start signing process
            //   signer.useKey(newTransaction)
            // }
          }
        })
        
        
        //if signatures meet threshold, send transaction to destination chain

    }
  }

  

  function applyForSigning(transaction) {
    
  }



module.exports = {
    startListeners,
    orderAssigner,
    orderListener,
    currentNodeDelayCheck
}