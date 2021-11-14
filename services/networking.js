'use strict';
var listener = require("./listener");

const { networkInterfaces } = require('os');
const net = require('net');

function startListening() {
    console.log(listener);
    listener.startListeners();
    listener.orderAssigner();
    listener.orderListener();
    listener.currentNodeDelayCheck();
}


function getMyIP() {
    
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (net.family === 'IPv4' && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    return results[Object.keys(results)[0]][0];
}

module.exports = {
    getMyIP,
    startListening
}