var peerConnection;
var uuid;
var test = 1;

var peerConnectionConfig = {
    'iceServers': [
        {'urls': 'stun:stun.services.mozilla.com'},
        {'urls': 'stun:stun.l.google.com:19302'},
    ]
};

function pageReady() {
    uuid = uuid();

    serverConnection = new WebSocket('wss://' + window.location.hostname + ':8443');
    serverConnection.onmessage = gotMessageFromServer;

    var constraints = {
        video: false,
        audio: false,
    };
}

function start(isCaller) {
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;

    if(isCaller) {
        peerConnection.createOffer().then(createdDescription).catch(errorHandler);
    }
}

function gotMessageFromServer(message) {
    if(!peerConnection) start(false);

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if(signal.uuid == uuid) return;

    if(signal.sdp) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {
            // Only create answers in response to offers
            if(signal.sdp.type == 'offer') {
                //SENDS ANSWER
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if(signal.ice) {
        peerConnection.addIceCandidate(new RTCIceCandidate(signal.ice)).catch(errorHandler);
    }
}

function gotIceCandidate(event) {
    if(event.candidate != null) {
        serverConnection.send(JSON.stringify({'ice': event.candidate, 'uuid': uuid}));
    }
}

function createdDescription(description) {
    console.log('got description');

    peerConnection.setLocalDescription(description).then(function() {
        //SENDS Offer
        serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }).catch(errorHandler);
}

function errorHandler(error) {
    console.log(error);
}

// Taken from http://stackoverflow.com/a/105074/515584
// Strictly speaking, it's not a real UUID, but it gets the job done here
function uuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function updateHTML(){
    let el = document.getElementById(test);
    el.className = '';
}