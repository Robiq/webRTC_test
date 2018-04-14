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
var peerConnection = {};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    errorHandler('request received(http): ' + request.url);
    try{
        if(request.url === '/') {
            response.writeHead(200, {'Content-Type': 'text/html'});
            response.end(fs.readFileSync('/home/robin/webRTC_test/Reverse_case/Client/index.html'));
        } else if(request.url === '/client.js') {
            response.writeHead(200, {'Content-Type': 'application/javascript'});
            response.end(fs.readFileSync('/home/robin/webRTC_test/Reverse_case/Client/client.js'));
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
    //Store connection creation time
    var dt = new Date();
    ws.utcDate ="[" + dt.toLocaleDateString() + "]";
    ws.id = uuid++;
    ws.test=0;
    ws.reset=0;
    conn[ws.id] = ws;
    curUUID = ws.id;
    log[curUUID] = "Start connection: " + ws.id+" \n\n";
    testLog[curUUID]='User ' + ws.id + ' Time '+ws.utcDate +'\nTest '+ conn[curUUID].test + ' succeeded!\n';
    ws.test++;
    ws.send(JSON.stringify({'set': true, 'uuid': ws.id}));
    errorHandler('Client ' + ws.id + ' connected! (ws)')
    //Message received in server!
    ws.on('message', function(message){
        message = JSON.parse(message);
        errorHandler('Got message(ws): ', message);
        handleMessage(message);
    });
});

function resetpeer(){
    errorHandler('Reset peerConnection for connection ', curUUID);
    var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};
    peerConnection[curUUID]=new RTCPeerConnection(peerConnectionConfig);
    //Logs ICE change
    peerConnection[curUUID].oniceconnectionstatechange = iceChange;
    //Takes care of ice-candidates
    peerConnection[curUUID].onicecandidate = gotIceCandidate;
}

//Handles messages from clients
function handleMessage(signal){
    curUUID = signal.uuid;

    if(signal.sdp) {
        resetpeer();
        //Once connection is set up - DO TEST!
        peerConnection[curUUID].setRemoteDescription(new RTCSessionDescription(signal.sdp)).catch(errorHandler);
        //prevDt = new Date();
        errorHandler('Remote description set!');
        //Create answer and send back
        peerConnection[curUUID].createAnswer().then(function (description){
            errorHandler('got description(webRTC): ', description);
            peerConnection[curUUID].setLocalDescription(description).catch(errorHandler);
        }).catch(errorHandler);
    }else if(signal.log) {
        //Save clients log
        errorHandler("Received client log from client " + curUUID);
        clientLog[signal.uuid]=signal.log;
        write();
        peerConnection[curUUID].close();
        resetpeer();
    }else if(signal.reset){
        var ws = conn[curUUID];
        //log result then reset TODO
        if(signal.success){
            errorHandler('Test ' + ws.test + ' succeeded!');
            testLog[curUUID]+='Test '+ ws.test + ' succeeded!\n';
        }else{
            errorHandler('Test ' + ws.test + ' failed!');
            testLog[curUUID]+='Test '+ ws.test + ' failed! Time is: ' + utcDate+'\n';
        }
        ws.test++;
        if (ws.test>5 && ws.reset >=2){
            errorHandler("Test are done - logging for " + curUUID +" is finished!");
            testLog[curUUID]+=("Testset nr. " + 3 + " finished!\n");
            write();
        } else if(ws.test == 6){
            ws.reset+=1;
            errorHandler("Testset nr. " + ws.reset + " finished!");
            testLog[curUUID]+=("Testset nr. " + ws.reset + " finished!\n");
            ws.test=1;
            write();
        }
        conn[curUUID].send(JSON.stringify({'reset': true}));
    }else{
        errorHandler('Unknown signal received(ws): ', signal);
    }
}

function gotIceCandidate(event) {
    if(event.candidate == null) {
        errorHandler('ICE done!');
        sendDescription();
    }
}

function iceChange(event){
    try{
        var state = peerConnection[curUUID].iceConnectionState;
        errorHandler("New ICE state: ", state);
    }catch(e){errorHandler('iceChange: ', e);}
    /*if(state == 'connected'){
        var dt = new Date();
        dt = dt - prevDt;
        let sec = Math.floor(dt/1000);
        errorHandler('It took ' + sec + ' sec to reach connected state.');        
    }*/
}

function sendDescription() {
    errorHandler('Sending answer to: ', curUUID);
    //SENDS Answer
    conn[curUUID].send(JSON.stringify({'sdp': peerConnection[curUUID].localDescription, 'uuid': serverID}));
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
    var fnam = "/home/robin/webRTC_test/Reverse_case/Logs/"+ conn[conID].utcDate+"_"+conID+;
    try{
        fs.writeFileSync(fnam+"_res.txt", testLog[conID]);
        errorHandler('The file has been saved (res)!');
    }catch(err){
        errorHandler("Writing results encountered an error: ", err);
    }
    
    try{
        fs.writeFileSync(fnam+"_log.txt", curLog);
        errorHandler('The file has been saved (log)!');
    }catch(err){
        errorHandler("Writing log encountered an error: ", err);
    }
}
errorHandler('Server running.');// Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');