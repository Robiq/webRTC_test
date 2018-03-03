const HTTPS_PORT = 8443;

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wrtc = require('wrtc');
var serverID = 0;
var uuid = 1;
var conn = {}
var log = {}; 
var clientLog = {};
var testLog = {};
var curUUID;
var RTCPeerConnection = wrtc.RTCPeerConnection;
var RTCSessionDescription = wrtc.RTCSessionDescription;
var RTCIceCandidate = wrtc.RTCIceCandidate
var prevDt;

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    errorHandler('request received(http): ' + request.url);
    try{
        if(request.url === '/') {
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(fs.readFileSync('/home/robin/webRTC_test/Client/index.html'));
        } else if(request.url === '/client.js') {
            response.writeHead(200, {'Content-Type': 'application/javascript'});
            response.end(fs.readFileSync('/home/robin/webRTC_test/Client/client.js'));
        } else if (request.url === '/favicon.ico') {
            response.writeHead(200, {'Content-Type': 'image/x-icon'} );
            response.end();
            console.log('favicon requested');
        } else{
            console.log('Invalid URL requested');
            response.writeHead(404);
            response.end();
        }
    }catch(e){
        errorHandler("Exception when serving file(http): ", e);
    }
};

var httpsServer = http.createServer(handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpsServer});

//First client connection
wss.on('connection', function(ws) {
    ws.id = uuid++;
    ws.test=0;
    ws.reset=0;
    conn[ws.id] = ws;
    curUUID = ws.id;
    log[curUUID] = "Start connection: " + ws.id+" \n\n";
    testLog[curUUID]='Test '+ conn[curUUID].test + ' succeeded!\n';
    ws.send(JSON.stringify({'set': true, 'uuid': ws.id}));
    errorHandler('Client ' + ws.id + ' connected! (ws)')
    //Store connection creation time
    var dt = new Date();
    ws.utcDate ="[" + dt.toLocaleDateString() + "] [" + dt.toLocaleTimeString() + "]";
    //Keep websocket alive
    //ws.keepAlive=setInterval(keepAlive, 90000, ws);
    //CREATE webRTC OFFER 1!
    webRTCBegin();
    //Message received in server!
    ws.on('message', function(message){
        message = JSON.parse(message);
        errorHandler('Got message(ws): ', message);
        handleMessage(message);
    });
});

//Handles messages from clients
function handleMessage(signal){
    /*if(signal.keepalive) {
        errorHandler('keepalive received');
    }else{
    */    curUUID = signal.uuid;

        if(signal.sdp) {
            //Once connection is set up - DO TEST!
            peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch(errorHandler);
            //prevDt = new Date();
            //Need short wait here to allow ICE-candidates to finish negotiation!
            //Try with 0.5sec delay!
            errorHandler('Remote description set!');
            setTimeout(runTest, 500);
        }else if(signal.log) {
            //Save clients log
            errorHandler("Received client log from client " + curUUID);
            clientLog[signal.uuid]=signal.log;
            write();
        }else{
            errorHandler('Unknown signal received(ws): ', signal);
        }
    //}
}

function resetpeer(){
    errorHandler('Reset peerConnection');
    var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};
    peerConnection=new RTCPeerConnection(peerConnectionConfig);
}

//Starts webRTC connection
function webRTCBegin(){
    var ws = conn[curUUID];
    ws.test++;
    if(ws.test < 6){
        var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};
        
        peerConnection = new RTCPeerConnection(peerConnectionConfig);

        //Takes care of ice-candidates
        peerConnection.onicecandidate = gotIceCandidate;
        //Logs ICE change
        peerConnection.oniceconnectionstatechange = iceChange;
        //datachannel
        peerConnection.createDataChannel('test', {reliable: true})
        //Creates offer
        peerConnection.createOffer().then(function (description){
            errorHandler('got description(webRTC): ', description);
            peerConnection.setLocalDescription(description).catch(errorHandler);
        }).catch(errorHandler);
    } else if (ws.test>5 && ws.reset >=2){
        errorHandler("Test are done - logging for " + curUUID +" is finished!");
        testLog[curUUID]+=("Testset nr. " + 3 + " finished!\n");
        //write();
        //clearInterval(ws.keepAlive);
        resetpeer();
    } else if(ws.test == 6){
        ws.reset+=1;
        errorHandler("Testset nr. " + ws.reset + " finished!");
        testLog[curUUID]+=("Testset nr. " + ws.reset + " finished!\n");
        ws.test=0;
        write();
        webRTCBegin();
    }
}

function gotIceCandidate(event) {
    if(event.candidate == null) {
        errorHandler('ICE done!');
        createDescription();
    }
}

function iceChange(event){
    try{
        var state = peerConnection.iceConnectionState;
        errorHandler("New ICE state: ", state);
    }catch(e){errorHandler('iceChange: ', e);}
    /*if(state == 'connected'){
        var dt = new Date();
        dt = dt - prevDt;
        let sec = Math.floor(dt/1000);
        errorHandler('It took ' + sec + ' sec to reach connected state.');        
    }*/
}

function createDescription() {
    errorHandler('Sending offer to: ', curUUID);
    //SENDS Offer
    conn[curUUID].send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': serverID}));
}

//Runs the current test
function runTest(){
    var res = 0;
    //Read connection state
    var state = peerConnection.iceConnectionState;
    //Log it
    errorHandler('State of connection: ', state);
    //Test connection state
    if(state == 'connected' || state=="completed"){
        //Connected means goodie!
        errorHandler('Test ' + conn[curUUID].test + ' succeeded!');
        testLog[curUUID]+='Test '+ conn[curUUID].test + ' succeeded!\n';
        res = true;
    }else{
        errorHandler('Test ' + conn[curUUID].test + ' failed!');
        var dt = new Date();
        var utcDate = "[" + dt.toLocaleDateString() + " | " + dt.toLocaleTimeString() + "]";
        testLog[curUUID]+='Test '+ conn[curUUID].test + ' failed!\n User is: ' + curUUID + ' and time is: ' + utcDate+'\n';
        res = false;
    }
    peerConnection=null;
    //Send result to client
    conn[curUUID].send(JSON.stringify({'reset': true, 'success': res}));
    webRTCBegin();
}

function errorHandler(error, obj) {
    var dt = new Date();
    var utcDate = "[" + dt.toLocaleDateString() + " | " + dt.toLocaleTimeString() + "]";
    if(obj === undefined){
        log[curUUID] += utcDate + ":\n " + error+"\n";
        console.log(error);
    }else{
        obj=JSON.stringify(obj);
        log[curUUID] += utcDate + ":\n " + error + obj + "\n";   
        console.log(error + obj);
    }
}


function write(){
    var conID = curUUID;
    var curLog = log[conID] + "--------------------------------------------\n\nClient log:\n-----------------\n"+clientLog[conID];
    var fnam = "/home/robin/webRTC_test/Logs/"+conID+" "+ conn[conID].utcDate;
    fs.writeFile(fnam+"_res.txt", testLog[conID], (err) => {
      if (err) errorHandler('Error writing to resultfile' ,err);
      errorHandler('The file has been saved (res)!');
    });
    fs.writeFile(fnam+"_log.txt", curLog, (err) => {
      if (err) errorHandler('Error writing to logFile' ,err);
      errorHandler('The file has been saved (log)!');
    });
}
/*
function keepAlive(ws){
    errorHandler('keepAlive sent for ' + ws.id);
    ws.send(JSON.stringify({'uuid': ws.id}));
}*/

errorHandler('Server running.');// Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');