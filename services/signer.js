var Web3 = require('web3');
var Port = require("../contractABIs/EVMPort.json")
var runMode = require('../config/'+('development')+'.js')
var TransactionsSchema = require('../models/transactions')
const axios = require('axios');
var ValidatorSchema = require('../models/validators')
var networking = require("./networking")
const path = require('path')
require("dotenv").config({path: path.resolve(__dirname, `../config/.env`)})

// //call GO TSig server with message in order to provide signature
async function signMessage (transaction) {
    let chainId;
    let web3;
    //detect end chain
    if (transaction.endChain === 'BSC') {
        if (runMode.mode == "production") {
            chainId = 56;
            web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[0]);
        } else {
            chainId = 97;
            web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.getblock.io/testnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[0]);
        }
    } else if (transaction.endChain === 'ETH') {
        if (runMode.mode == "production") {
            chainId = 1;
            web3 = new Web3(new Web3.providers.HttpProvider('https://eth.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[1]);
        } else {
            chainId = 3;
            web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/'+process.env.INFURA_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[1]);
        }
    } else if (transaction.endChain === 'HECO') {
        if (runMode.mode == "production") {
            chainId = 128;
            web3 = new Web3(new Web3.providers.HttpProvider('https://heco.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[2]);
        } else {
            chainId = 256;
            web3 = new Web3(new Web3.providers.HttpProvider("https://http-testnet.hecochain.com"));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[2]);
        }
    }
    let currentNonce = contract.methods.nonce().call();
    //get chainId dynamically
    const msgParams = JSON.stringify({types: {
        EIP712Domain: [
          {name: "name",type: "string"},
          {name: "version",type: "version"},
          {name: "chainId",type: "uint"},
          {name: "verifyingContract",type:"address"}
        ],
        inboundSwap: [
          {name:"_startChain",type:"string"},
          {name:"sender",type:"address"},
          {name:"recipient",type:"address"},
          {name:"destination",type:"address"},
          {name:"amount",type:"uint256"},
          {name:"entryHash",type:"byte32"}
        ]
      },
      primaryType: "inboundSwap",
      domain: {name:"HOKK Bridge Port",version:"1",chainId:chainId,verifyingContract:contract.options.address},
      message:{
        _startChain: transaction.startChain,
        sender: transaction.sender,
        recipient: transaction.recipient,
        destination: transaction.destination,
        amount: transaction.amount,
        entryHash: transaction.hash
      }
    })
    console.log(msgParams);
   
    let signedMessage = await web3.eth.accounts.sign(msgParams, process.env.TESTNET_PRIVATE_KEY);
    console.log(signedMessage);
    let v = signedMessage.v;
    let r = Web3.utils.toHex(signedMessage.r);
    console.log(r);
    let s = Web3.utils.toHex(signedMessage.s);
    let h = signedMessage.messageHash;
    //update DB file
    if (v && r && s) {
        TransactionsSchema.findOne({hash: transaction.hash}, function(err, existingTransaction) {
            console.log(existingTransaction);
            let hasSigned = false;
            for (let i = 0; i < existingTransaction.signers.length; i++) {
                if (existingTransaction.signers[i] == runMode.moniker) {
                    hasSigned = true;
                }
            }
            if (!hasSigned) {
                existingTransaction.v.push(v);
                existingTransaction.r.push(r);
                existingTransaction.s.push(s);
                existingTransaction.h.push(h);
                existingTransaction.signers.push(runMode.moniker);
                existingTransaction.save().then(() => {
                    
                    //send update to all nodes
                    console.log('Saving signature');
                    sendSignedMessage(existingTransaction);
                });
                
            }
        })
    }
}

function sendSignedMessage(transaction) {
    ValidatorSchema.find({}, function(err, validators) {
        console.log('Attempting to notify other nodes of signing');
        for(var i = 0; i < validators.length; i++) {
            if (validators[i].moniker && validators[i].moniker !== runMode.moniker) {
              axios.post(validators[i].IP + '/validator/update-transaction', {
                transaction,
                moniker: runMode.moniker,
                partyPassword: runMode.partyPassword
              }).then(function() {

              }).catch(function() {
                console.log('Error sending transaction to: ' + validators[i]);
              })
            }
        }
    })
} 

function useKey(transactionDoc) {
    console.log('signing.')
    console.log(process.env.INFURA_API_KEY);
    let privateKey = process.env.TESTNET_PRIVATE_KEY;
    if (transactionDoc.endChain === 'BSC') {
        
        var web3;
        var contract;
        if (runMode.mode == "production") {
            web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[0]);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider('https://bsc.getblock.io/testnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[0]);
        }
        
        const transaction = contract.methods.execute(
            transactionDoc.startChain, 
            transactionDoc.sender,
            transactionDoc.recipient,
            transactionDoc.destination,
            new web3.utils.BN(transactionDoc.amount.toString()),
            transactionDoc.v, transactionDoc.r, transactionDoc.s, transactionDoc.h);

        if (runMode.mode == "production") {
            sendTransaction(web3, privateKey, runMode.portContracts[0], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        } else {
            sendTransaction(web3, privateKey, runMode.testPortContracts[0], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        }
    } else if (transactionDoc.endChain === 'ETH') {
        console.log(process.env.INFURA_API_KEY);
        
        var web3;
        var contract;
        if (runMode.mode == "production") {
            web3 = new Web3(new Web3.providers.HttpProvider('https://eth.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[1]);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider('https://ropsten.infura.io/v3/'+process.env.INFURA_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[1]);
        }
        const transaction = contract.methods.execute(
            transactionDoc.startChain, 
            transactionDoc.sender,
            transactionDoc.recipient,
            transactionDoc.destination,
            new web3.utils.BN(transactionDoc.amount.toString()),
            transactionDoc.v, transactionDoc.r, transactionDoc.s, transactionDoc.h);
        if (runMode.mode == "production") {
            sendTransaction(web3, privateKey, runMode.portContracts[1], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        } else {
            sendTransaction(web3, privateKey, runMode.testPortContracts[1], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        }
        
    } else if (transactionDoc.endChain === 'HECO') {
        
        var web3;
        var contract;
        if (runMode.mode == "production") {
            web3 = new Web3(new Web3.providers.HttpProvider('https://heco.getblock.io/mainnet/?api_key='+process.env.GETBLOCK_API_KEY));
            contract = new web3.eth.Contract(Port.abi, runMode.portContracts[2]);
        } else {
            web3 = new Web3(new Web3.providers.HttpProvider("https://http-testnet.hecochain.com"));
            contract = new web3.eth.Contract(Port.abi, runMode.testPortContracts[2]);
        }
        
        const transaction = contract.methods.execute(
            transactionDoc.startChain, 
            transactionDoc.sender,
            transactionDoc.recipient,
            transactionDoc.destination,
            new web3.utils.BN(transactionDoc.amount.toString()),
            transactionDoc.v, transactionDoc.r, transactionDoc.s, transactionDoc.h);
        if (runMode.mode == "production") {
            sendTransaction(web3, privateKey, runMode.portContracts[2], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        } else {
            sendTransaction(web3, privateKey, runMode.testPortContracts[2], transaction, transactionDoc.hash, transactionDoc.endChain, 0);
        }
        
    }
    
}

async function sendTransaction(web3, privateKey, contractAddress, transaction, hash, endChain, gasBoost) {
    console.log('sending transaction')
    
    const account = web3.eth.accounts.privateKeyToAccount(privateKey).address;
    // console.log(await transaction.estimateGas())
    console.log(account)
    console.log(transaction.encodeABI())
    console.log(contractAddress)
    let gasPrice = await web3.eth.getGasPrice();
    console.log('GAS PRICE FOR: '+endChain, gasPrice );
    if (endChain == "BSC") {
        if (gasPrice < 10000000000) {
            gasPrice = 12000000000;
        }
    }
    if (endChain == "ETH") {
        gasPrice = parseInt(gasPrice) + ((parseInt(gasPrice,10)*20) / 100);
    }
    if (endChain == "HECO") {
        if (gasPrice < 5000000000) {
            gasPrice = 5000000000;
        }
    }
    let gasEstimate = await transaction.estimateGas({from: account});
    const options = {
        from: account,
        to      : contractAddress,
        data    : transaction.encodeABI(),
        gasPrice: parseInt(gasPrice, 10)+parseInt(gasBoost, 10),
        gas: gasEstimate
    };

    console.log(options)
    const signed  = await web3.eth.accounts.signTransaction(options, privateKey);
    
    console.log('SIGNED',signed)
    const receipt = await web3.eth.sendSignedTransaction(signed.rawTransaction, function(error, result) {
        if (error) {
            console.log('Transaction attempt failed with error: ', error);
            console.log('retrying in a random time between now and 60seconds');
            setTimeout(function() {
                let gasBoostIncrease = parseInt(gasBoost, 10)+parseInt(100000000, 10);
                sendTransaction(web3, privateKey, contractAddress, transaction, hash, endChain, gasBoostIncrease);
            }, Math.floor(Math.random() * 60000));
        } else {

            //save the hash of receipt to the transaction
            TransactionsSchema.findOneAndUpdate({hash: hash}, {
                endHash: result
                
            }, {upsert: true, new: true}, function(err, updatedTransaction) {
                if (err) {
                    
                }
                console.log('RECEIPT', result);
                sendSignedMessage(updatedTransaction);
                return result;
            })
        }
    });
    
    
}

module.exports = {
    useKey,
    signMessage
}