const HTTPS_PORT = 8443;

const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;
var serverID = 0;
var uuid = 1;
var conn = {}

// Yes, SSL is required
const serverConfig = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
};

// ----------------------------------------------------------------------------------------

// Create a server for the client html page
var handleRequest = function(request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);

    if(request.url === '/') {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end(fs.readFileSync('Client/index.html'));
    } else if(request.url === '/webrtc.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'});
        response.end(fs.readFileSync('Client/client.js'));
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
    ws.test=2;
    conn[ws.id] = ws;
    ws.send(JSON.stringify({'set': true, 'uuid': ws.id}));
    console.log('Client ' + ws.id + ' connected!')
    //CREATE webRTC OFFER 1!
    webRTCBegin(ws);
    //Message received in server!
    ws.on('message', handleMessage(message));
});

//Handles messages from clients
function handleMessage(message){
    console.log('received: %s', message);
    if(signal.sdp) {
        //Once connection is set up - DO TEST!
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(runTest(message.uuid)).catch(errorHandler);
    }else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

//Starts webRTC connection
function webRTCBegin(ws){
    //Increments test number
    ws.test++;

    var peerConnectionConfig = {
        'iceServers': [
            {'urls': 'stun:stun.services.mozilla.com'},
            {'urls': 'stun:stun.l.google.com:19302'},
        ]
    };
    var peerConnection = new RTCPeerConnection(peerConnectionConfig);
    //Takes care of ice-candidates
    peerConnection.onicecandidate = function(event, ws){
        if(event.candidate != null) {
            ws.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
        }
    };

    //Creates offer
    peerConnection.createOffer().then(function (description, ws){
        console.log('got description', description);

        peerConnection.setLocalDescription(description).then(function() {
            //SENDS Offer
            ws.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': serverID}));
        }).catch(errorHandler);
    }).catch(errorHandler);
}

//Runs the current test
function runTest(){


    //RTCPeerConnection.connectionState
}

function errorHandler(error) {
    console.log(error);
}

console.log('Server running. Visit https://localhost:' + HTTPS_PORT + ' in Firefox/Chrome (note the HTTPS; there is no HTTP -> HTTPS redirect!)');