var peerConnection;
var uuid=-1;
var test = 1;
var log='';
var serverConnection;
var keep;

var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};

//Activates when page is loaded
function pageReady() {

    serverConnection = new WebSocket('ws://' + window.location.hostname + ':8443');
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
    } 
        

    var signal = JSON.parse(message.data);

    // Ignore messages from ourself
    if(signal.uuid == uuid){
        errorHandler('KeepAlive received');
    }

    if(signal.set){
        uuid = signal.uuid
        document.getElementById("ws").className = '';
        //keep=setInterval(keepAlive, 75000);
    }
    //Receive offer from server
    if(signal.sdp) {
        //Simulates server-delay
        if( test > 5 && test < 11 ){
            setDescription(signal.sdp);
        }else{
            //Delay currently 5sec - 5 min
            //TODO MOVE TO ICEGATHERING FINISHED! (Server case!)
            //JUST swap places and let client create offer and server receive and we gud?
            errorHandler('Delaying server for case: ' + test);
            switch(test){
                case 1:
                case 11: setTimeout(setDescription, 5000, signal.sdp); break;
                case 2: 
                case 12: setTimeout(setDescription, 30000, signal.sdp); break;
                case 3: 
                case 13: setTimeout(setDescription, 60000, signal.sdp); break;
                case 4: 
                case 14: setTimeout(setDescription, 120000, signal.sdp); break;
                case 5: 
                case 15: setTimeout(setDescription, 300000, signal.sdp); break;
                default: errorHandler("Testcase not recognized - Server delay");
            }
        }
    } else if(signal.reset){
        if(signal.success){
            errorHandler('Test '+ test + ' succeeded');
            updateHTML(true);
        }else{
            errorHandler('Test '+ test + ' failed');       
            updateHTML(false);
        }

        //Removed one updateHTML from each if-clause
        //Handling new tests/finished testing
        if(++test == 6){
            document.getElementById("T1D").className = '';
            document.getElementById("T2").className = '';
            serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
        }else if(test == 11){
            document.getElementById("T2D").className = '';
            document.getElementById("T3").className = '';
            serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
        }else if(test>15){
            document.getElementById("T3D").className = '';
            errorHandler('Testing finished!');
            serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
            //clearInterval(keep);
        }
        start();
    }
}

function setDescription(sig){
    peerConnection.setRemoteDescription(new RTCSessionDescription(sig)).then(function() {
        // Only create answers in response to offers
        if(sig.type == 'offer') {
            //SENDS ANSWER
            peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
        }
    }).catch(errorHandler);
}

//Answers the offer
function createdDescription(description) {
    errorHandler('Created description', description);

    peerConnection.setLocalDescription(description).then(function() {
        errorHandler('Local description set!');
    }).catch(errorHandler);
}

function gotIceCandidate(event) {
    if(event.candidate == null){
        errorHandler('ICE done. Answer: ', peerConnection.localDescription);
        //SENDS ANSWER
        //Simulates client-delay
        if( test > 5 ){
            //Delay currently 5sec - 5 min
            errorHandler('Delaying client for case: ' + test);
            switch(test){
                case 6:
                case 11: setTimeout(sendSDP, 5000); break;
                case 7: 
                case 12: setTimeout(sendSDP, 30000); break;
                case 8: 
                case 13: setTimeout(sendSDP, 60000); break;
                case 9: 
                case 14: setTimeout(sendSDP, 120000); break;
                case 10: 
                case 15: setTimeout(sendSDP, 300000); break;
                default: errorHandler("Testcase not recognized - Client Delay");
            }
        }else{
            sendSDP();
        }
    }
}

function sendSDP(){
    errorHandler('Sending reply');
    serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
}

function errorHandler(error, obj=null) {
    var dt = new Date();
    var utcDate = dt.toUTCString();
    if(obj){
        obj=JSON.stringify(obj);
        log += "["+utcDate + "]:\n " + error + obj + '\n';
        console.log(error + obj);
    }else{
        log += "["+utcDate + "]:\n " + error+'\n';
        console.log(error);
    }
}

//Updates html
function updateHTML(res){
    var out='';
    if(res) out='SUCESS';
    else    out='FAILED';
    errorHandler('Displaying test ' + test + ' result =' + out);
    if(test < 16){
        let el = document.getElementById(test);
        let x = el.innerHTML;
        x = x.replace("#", out);
        el.innerHTML=x;
        el.className = '';
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
/*
function keepAlive(ws){
    errorHandler('keepAlive sent!');
    serverConnection.send(JSON.stringify({'keepalive': uuid}));
}*/