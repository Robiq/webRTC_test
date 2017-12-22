const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
const wrtc = require('wrtc');
var serverID = 0;
var uuid = 1;
var conn = {}
var log = {}; 
var clientLog = {};
var curUUID;
var RTCPeerConnection = wrtc.RTCPeerConnection;
var RTCSessionDescription = wrtc.RTCSessionDescription;
var RTCIceCandidate = wrtc.RTCIceCandidate
var prevDt;

// Yes, SSL is required
const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    errorHandler('request received(http): ' + request.url);
    try{
    if(request.url === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('Client/index.html'));
    } else if(request.url === '/client.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('Client/client.js'));
    }
    }catch(e){
        errorHandler("Exception when serving file(http): ", e);
    }
};

var httpsServer = https.createServer(serverConfig, handleRequest);
httpsServer.listen(HTTPS_PORT, '0.0.0.0');

// ----------------------------------------------------------------------------------------

// Create a server for handling websocket calls
var wss = new WebSocketServer({server: httpsServer});

//First client connection
wss.on('connection', function(ws) {
    ws.id = uuid++;
    ws.test=1;
    conn[ws.id] = ws;
    curUUID = ws.id;
    log[curUUID] = "Start connection: " + ws.id+" \n\n";
    ws.send(JSON.stringify({'set': true, 'uuid': ws.id}));
    errorHandler('Client ' + ws.id + ' connected! (ws)')
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
    curUUID = signal.uuid;
    if(signal.sdp) {
        //Once connection is set up - DO TEST!
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch(errorHandler);
        prevDt = new Date();
        runTest();
    }else if(signal.log) {
        //Save clients log
        errorHandler("Received client log from client " + curUUID);
        clientLog[signal.uuid]=signal.log;
        write();
    }else{
        errorHandler('Unknown signal received(ws): ', signal);
    }
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
    }else{
        errorHandler("Test are done - logging for " + curUUID +" is finished!");
    }
}

function gotIceCandidate(event) {
    if(event.candidate == null) {
        errorHandler('ICE done!');
        createDescription();
    }
}

function iceChange(event){
    let state = peerConnection.iceConnectionState;
    errorHandler("New ICE state: ", state);
    if(state == 'connected'){
        var dt = new Date();
        dt = dt - prevDt;
        let sec = Math.floor(dt/1000);
        errorHandler('It took ' + sec + ' sec to reach connected state.');
        //TEST TODO Remove!
        webRTCBegin();
    }
}

async function createDescription() {
    //Add delay
    switch(conn[curUUID].test){
        case 1: break;;
        case 2: await sleep(500); break;
        case 3: await sleep(1000); break;
        case 4: await sleep(2000); break;
        case 5: await sleep(10000); break;
        default: errorHandler("Testcase not recognized!");
    }
    
    //SENDS Offer
    conn[curUUID].send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': serverID}));
}

async function buffer(){
    await sleep(15000);
}

//Runs the current test
function runTest(){

    //Need some sort of wait buffer here to allow ICE-candidates to finish negotiation!

    var res = 0;
    //Read connection state
    let state = peerConnection.iceConnectionState;
    //Log it
    errorHandler('State of connection: ', state);
    //Test connection state
    if(state == 'connected'){
        //Connected means goodie!
        errorHandler('Test ' + conn[curUUID].test + ' succeeded!');
        res = true;
    }else{
        errorHandler('Test ' + conn[curUUID].test + ' failed!');
        res = false;
    }
    //Send result to client
    conn[curUUID].send(JSON.stringify({'reset': true, 'success': res}));
    //TEST TODO re-enable
    //webRTCBegin();
}

function errorHandler(error, obj=null) {
    var dt = new Date();
    var utcDate = dt.toUTCString();
    if(obj){
        obj=JSON.stringify(obj);
        log[curUUID] += utcDate + ":\n " + error + obj + "\n\n";   
        console.log(error + obj);
    }else{
        log[curUUID] += utcDate + ":\n " + error+"\n\n";
        console.log(error);
    }
}


function write(){
    console.warn(curUUID);
    var dt = new Date();
    var utcDate = dt.toUTCString();
    let conID = curUUID;
    let curLog = log[conID] + "--------------------------------------------\nClient log:\n"+clientLog[conID];
    fs.appendFileSync("Logs/"+utcDate+"_"+conID+"_log.txt", curLog);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

errorHandler('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');