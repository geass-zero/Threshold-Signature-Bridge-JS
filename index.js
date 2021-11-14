var express  = require('express')
const cors = require('cors')
var runMode = require('./config/'+('development')+'.js')
var networking = require('./services/networking');
var OrderSchema = require('./models/order')
const axios = require('axios');
const path = require('path')
const rateLimit = require("express-rate-limit");
require("dotenv").config({path: path.resolve(__dirname, `./config/.env`)})
var app  = express()
app.enable('trust proxy');
app.use(
    express.urlencoded({
      extended: true
    })
)
app.use(express.json())
app.use(cors())

var mongoose = require('mongoose')
mongoose.connect(runMode.mongoURL, {useNewUrlParser: true, useUnifiedTopology: true});


var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var ValidatorSchema = require('./models/validators')
const validatorRoutes = require('./api/validator')
const historyRoutes = require('./api/history')

//check if initial validator and if validator has been initialized
var noValidators = false;
ValidatorSchema.findOneAndUpdate({moniker: runMode.moniker}, {
    nodeOrder: 0,
    moniker: runMode.moniker,
    pubKey: '',
    lastPingTime: Date.now(),
    IP: runMode.myIP
}, {new:true, upsert:true}, function(err, vUpdate) {
    ValidatorSchema.find({}, function(err, validators) {
        OrderSchema.findOne({}, function(err, order) {
            if (!order) {
                let newOrder = new OrderSchema({
                    currentNode: 0,
                    orderHeight: 0,
                    timeSinceSwitch: Date.now()
                });
                newOrder.save();
            }
        });
        console.log(err)
        console.log(validators)
        if (!validators[0]) {
            noValidators = true;
        }
    
        if (runMode.isGenesis && noValidators) {
            //create validator document
            let genesisValidator = new ValidatorSchema({
                nodeOrder: 0,
                moniker: runMode.moniker,
                pubKey: '',
                lastPingTime: Date.now(),
                IP: runMode.myIP
            });
            console.log('Genesis created')
            genesisValidator.save();
            runMode.genesisIP = genesisValidator.IP;
            //wait for parties
        } 
        
        if (runMode.isGenesis && !noValidators) {
            ValidatorSchema.findOne({moniker: runMode.moniker}, function(err, genesis) {
                if (genesis.IP !== runMode.myIP) {
                    genesis.IP = runMode.myIP;
                    genesis.save();
                    console.log('IP updated to ' + genesis.IP)
                }
            })
        }
    
        if ((runMode.currentPartyCount <= validators.length)){
            networking.startListening();
            // listeners.startListeners();
            // listeners.orderAssigner();
            // listeners.orderListener();
            // listeners.currentNodeDelayCheck();
        }
    
        if (!runMode.isGenesis && (runMode.currentPartyCount > validators.length)){
            console.log('Attempting to resync');
            // axios.post(runMode.genesisIP + '/validator/resync', {
            //     partyPassword: runMode.partyPassword
            // }).then((res) => {
                
            // })
            
            // if (res.order) {
            //     console.log(res);
            //     OrderSchema.findOneAndUpdate({}, res.order, {new:true,upsert:true}, function(err, updatedOrder) {
            //         Promise.all(res.validators.map(validator => {
            //             ValidatorSchema.findOneAndUpdate({moniker: validator.moniker}, validator, {new:true, upsert:true}, function(err, saveRes) {
    
            //             })
            //         })).then(result => {
                        
                        
            //         }).catch(err => {
            //             console.log('Error syncing validator documents');
            //         })
                    
            //     })
            // }
            
            ValidatorSchema.findOneAndUpdate({moniker: runMode.moniker}, {
                moniker: runMode.moniker,
                pubKey: '',
                lastPingTime: Date.now(),
                IP: runMode.myIP
            },{upsert: true, new: true}, function(err, res) {
                console.log('My party moniker set to ' + runMode.moniker)
                console.log('My party IP set to ' + runMode.myIP)
                //send node information to genesis node
                axios.post(runMode.genesisIP + '/validator/add-validator-for-genesis', {
                    moniker: runMode.moniker,
                    pubKey: '',
                    lastPingTime: Date.now(),
                    IP: runMode.myIP,
                    partyPassword: runMode.partyPassword,
                }).then(function() {
                    console.log('Waiting for Genesis to initialize');
                })
            })
        }
    })
})




var server = app.listen(process.env.PORT || 7044, () => {
    console.log('Server is started on port:'+ (process.env.PORT || 7044))
    app.use('/validator',validatorRoutes)
    app.use('/history',historyRoutes)
})
