var peerConnection;
var uuid=-1;
var test = 1;
var log='';
var serverConnection;
var delay=false;

var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};

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
    errorHandler("Running test: " + test);
    peerConnection = new RTCPeerConnection(peerConnectionConfig);
    peerConnection.onicecandidate = gotIceCandidate;
}

function gotMessageFromServer(message) {
    if(!peerConnection){
        start();
        updateHTML();
        test++;
    } 
        

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
                //SENDS ANSWER
                peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
            }
        }).catch(errorHandler);
    } else if(signal.reset){
        if(signal.success){
            errorHandler('Test '+ test + ' succeeded');
            updateHTML();
        }else{
            errorHandler('Test '+ test + ' failed');       
        }

        //Handling new tests/finished testing
        if(++test == 7){
            updateHTML();
            document.getElementById("T2").className = '';
            delay=true;
            test++;

        }else if(test == 13){
            updateHTML();
            document.getElementById("T3").className = '';
            test++;

        }else if(test>=19){
            updateHTML();
            serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
            errorHandler('Testing finished!');
        }
        start();
    }
}

//Answers the offer
function createdDescription(description) {
    errorHandler('Created description', description);

    peerConnection.setLocalDescription(description).then(function() {
        errorHandler('Local description set!');
    }).catch(errorHandler);
}

async function gotIceCandidate(event) {
    if(event.candidate == null){
        errorHandler('ICE done. Answer: ', peerConnection.localDescription);
        //SENDS ANSWER
        if(delay){
        //Delay currently from .5 - 30 sec
            switch(test){
                case 14:
                case 8: await sleep(500); break;
                case 15: 
                case 9: await sleep(2000); break;
                case 16: 
                case 10: await sleep(5000); break;
                case 17: 
                case 11: await sleep(10000); break;
                case 18: 
                case 12: await sleep(30000); break;
                default: errorHandler("Testcase not recognized");
            }
        }
        serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
    }
}

function errorHandler(error, obj=null) {
    var dt = new Date();
    var utcDate = dt.toUTCString();
    if(obj){
        obj=JSON.stringify(obj);
        log += utcDate + ":\n " + error + obj + '\n\n';
        console.log(error + obj);
    }else{
        log += utcDate + ":\n " + error+'\n\n';
        console.log(error);
    }
}

//Updates html
function updateHTML(){
    errorHandler('Displaying test ' + test + ' succeeded');
    if(test < 21){
        let el = document.getElementById(test);
        el.className = '';
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}