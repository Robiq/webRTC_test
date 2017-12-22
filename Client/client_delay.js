var peerConnection;
var uuid=-1;
var test = 1;
var log;

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

//Activates when page is loaded
function pageReady() {

    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;

    var constraints = {
        video: false,
        audio: false,
    };
}

//Starts peer connection
function start() {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
}

function gotMessageFromServer(message) {
    if(!peerConnection) start();

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if(signal.uuid == uuid) return;

    if(signal.set){
        uuid = signal.uuid
        updateHTML();
        test++;
    }
    //Receive offer from server
    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            // Only create answers in response to offers
            if(signal.sdp.type == 'offer') {
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    //Receive ICE candidate
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    //Reset for new test
    } else if(signal.reset){
        if(signal.success){
            updateHTML();
        }
        if(++test>=6){
            updateHTML();
            serverConnection.send(JSON.stringify({'log': log}));
        }
        start();
    }
}

//Answers the offer
function createdDescription(description) {
    errorHandler('got description', description);

    //SENDS ANSWER
    switch(test){
        case 1: break;
        case 2: await sleep(500); break;
        case 3: await sleep(1000); break;
        case 4: await sleep(2000); break;
        case 5: await sleep(10000); break;
        default: errorHandler("Testcase not recognized");
    }

    peerConnection.setLocalDescription(description).then(function() {
        serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

function errorHandler(error) {
    var dt = new Date();
    var utcDate = dt.toUTCString();
    log += utcDate + ": " + error;
    console.log(error);
}
//Updates html
function updateHTML(){
    let el = document.getElementById(test);
    el.className = '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}