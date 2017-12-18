const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
var serverID = 0;
var uuid = 1;
var conn = {}
var log, clientLog = {};
var curUUID;
var peerConnection;

// Yes, SSL is required
const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    errorHandler('request received: ' + request.url);

    if(request.url === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('Client/index_delay.html'));
    } else if(request.url === '/webrtc.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('Client/client_delay.js'));
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
    ws.send(JSON.stringify({'set': true, 'uuid': ws.id}));
    errorHandler('Client ' + ws.id + ' connected!')
    curUUID = ws.id;
    //CREATE webRTC OFFER 1!
    webRTCBegin();
    //Message received in server!
    ws.on('message', handleMessage(message));
});

//Handles messages from clients
function handleMessage(signal){
    errorHandler('received: %s', signal);
    curUUID = signal.uuid;
    if(signal.sdp) {
        //Once connection is set up - DO TEST!
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(runTest(message.uuid)).catch(errorHandler);
    }else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }else if(signal.log) {
        //Save clients log
        clientLog[signal.uuid]=signal.log;
    }
}

//Starts webRTC connection
function webRTCBegin(){
    ws.test++;
    if(test < 6){
        var ws = conn[curUUID];
        var peerConnectionConfig = {
            'iceServers': [
                {'urls': 'stun:stun.services.mozilla.com'},
                {'urls': 'stun:stun.l.google.com:19302'},
            ]
        };
        peerConnection = new RTCPeerConnection(peerConnectionConfig);

        //Takes care of ice-candidates
        peerConnection.onicecandidate = gotIceCandidate;

        //Creates offer
        peerConnection.createOffer().then(function (description){
            errorHandler('got description', description);

            peerConnection.setLocalDescription(description).then(createDescription).catch(errorHandler);
        }).catch(errorHandler);
    }else{
        errorHandler("Test are done - logging for " + curUUID +" is finished!");
    }
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        conn[curUUID].send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

function createDescription(description) {
    //Add delay
    switch(test){
        case 1: continue;
        case 2: await sleep(500);
        case 3: await sleep(1000);
        case 4: await sleep(2000);
        case 5: await sleep(10000);
        default: errorHandler("Testcase not recognized");
    }
    //SENDS Offer
    conn[curUUID].send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': serverID}));
}

//Runs the current test
function runTest(){
    var res = 0;
    //Read connection state
    let state = peerConnection.iceConnectionState;
    //Log it
    errorHandler(state);
    //Test connection state
    if(state == 'connected'){
        //Connected means goodie!
        res = true;
    }else{
        res = false;
    }
    //Send result to client
    send conn[curUUID].send(JSON.stringify({'reset': true, 'success': res}));
    webRTCBegin();
}

function errorHandler(error) {
    var dt = new Date();
    var utcDate = dt.toUTCString();
    log[curUUID] += utcDate + ": " + error+"\n";
    console.log(error);
}


function write(){
    let conID = curUUID;
    let curLog = log[conID] + "--------------------------------------------\nClient log:\n"+clientLog[conID];
    fs.appendFileSync(conID+"_log.txt", )
}

errorHandler('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');