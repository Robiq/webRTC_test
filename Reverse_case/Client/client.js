var peerConnection;
var uuid=-1;
var test = 1;
var log='';
var serverConnection;
var peerConnection;
var peerConnectionConfig = {'iceServers': [{'url': 'stun:stun.gmx.net'}]};

//Activates when page is loaded
function pageReady() {

    serverConnection = new WebSocket('ws://' + window.location.hostname + ':9443');
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
    peerConnection.oniceconnectionstatechange = iceChange;
    //datachannel
    peerConnection.createDataChannel('test', {reliable: true})
    //Creates offer
    peerConnection.createOffer().then(function (description){
        errorHandler('got description(webRTC): ', description);
        peerConnection.setLocalDescription(description).catch(errorHandler);
    }).catch(errorHandler);
}

function gotMessageFromServer(message) {

    var signal = JSON.parse(message.data);
    errorHandler("Signal received ",signal);

    //Ignore messages from ourself
    if(signal.uuid === uuid){
    	errorHandler("Ignore messages sent from this client");
    
    //Set own uuid and start
    }else if(signal.set){
	    uuid = signal.uuid
	    document.getElementById("ws").className = '';
	    //Start WebRTC!
	    start();          
   	
    //Receive Answer from server
    }else if(signal.sdp){
   		handleSDP(signal);      
    
    //Ready for next test
    }else if(signal.reset){
   	    test++;
        if(test>15){
            try{
                peerConnection.close();
                serverConnection.close();
            }catch(err){
                errorHandler("Closing connections: ", err);
            }
        }else{
   		   start();
        }
    }else{
        errorHandler("Unknown signal!", signal);
    }
}

function handleSDP(signal){
	//Simulates client-delay
    if( test < 6){
        setDescription(signal.sdp);
    }else{
        //Delay currently 5sec - 5 min
        errorHandler('Delaying Client for case: ' + test);
        switch(test){
            case 6:
            case 11: setTimeout(setDescription, 5000, signal.sdp); break;
            case 7: 
            case 12: setTimeout(setDescription, 30000, signal.sdp); break;
            case 8: 
            case 13: setTimeout(setDescription, 60000, signal.sdp); break;
            case 9: 
            case 14: setTimeout(setDescription, 120000, signal.sdp); break;
            case 10: 
            case 15: setTimeout(setDescription, 300000, signal.sdp); break;
            default: errorHandler("Testcase not recognized - Client delay");
        }
    }
}

function gotIceCandidate(event) {
    if(event.candidate == null){
        errorHandler('ICE done. Offer: ', peerConnection.localDescription);
        //SENDS ANSWER
        //Simulates Server-delay
        if( test < 6  || test > 10 ){
            //Delay currently 5sec - 5 min
            errorHandler('Delaying Server for case: ' + test);
            switch(test){
                case 1:
                case 11: setTimeout(sendSDP, 5000); break;
                case 2: 
                case 12: setTimeout(sendSDP, 30000); break;
                case 3: 
                case 13: setTimeout(sendSDP, 60000); break;
                case 4: 
                case 14: setTimeout(sendSDP, 120000); break;
                case 5: 
                case 15: setTimeout(sendSDP, 300000); break;
                default: errorHandler("Testcase not recognized - Server Delay");
            }
        }else{
            sendSDP();
        }
    }
}

function iceChange(event){
    try{
        var state = peerConnection[curUUID].iceConnectionState;
        errorHandler("New ICE state: ", state);
    }catch(e){
        errorHandler('iceChange error: ', e);
        errorHandler('iceChange event: ', event);
    }
    /*if(state == 'connected'){
        var dt = new Date();
        dt = dt - prevDt;
        let sec = Math.floor(dt/1000);
        errorHandler('It took ' + sec + ' sec to reach connected state.');        
    }*/
}

function setDescription(sig){
    peerConnection.setRemoteDescription(new RTCSessionDescription(sig)).then(function() {
        // Only create answers in response to offers
        if(sig.type == 'offer') {
            //SENDS ANSWER
            console.warn("FUCK! WRONG!! - Received an offer!");
            peerConnection.createAnswer().then(createdDescription).catch(errorHandler);
        }else{
            console.log("Received answer!", sig);
            //Handle testing of connection!
            //Need short wait here to allow ICE-candidates to finish negotiation!
			//Try with 0.5sec delay!
			setTimeout(runTest, 500);
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

function sendSDP(){
    errorHandler('Sending offer');
    serverConnection.send(JSON.stringify({'sdp': peerConnection.localDescription, 'uuid': uuid}));
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
        errorHandler('Test ' + test + ' succeeded!');
        res = true;
    }else{
        errorHandler('Test ' + test + ' failed!');
        var dt = new Date();
        var utcDate = "[" + dt.toLocaleDateString() + " | " + dt.toLocaleTimeString() + "]";
        res = false;
    }
    peerConnection=null;
    //Send result to Server (acting as client)
    serverConnection.send(JSON.stringify({'reset': true, 'success': res, 'uuid': uuid}));
    updateHTML(res);
}

//Updates html
function updateHTML(res){
    var out='';
    if(res) out='done! Status: SUCCESS';
    else    out='done! Status: FAILED';
    errorHandler('Displaying test ' + test + ' result =' + out);
    if(test < 16){
        let el = document.getElementById(test);
        let x = el.innerHTML;
        x = x.replace("#", out);
        el.innerHTML=x;
        el.className = '';
    }
    if(test==5){
       document.getElementById("T1D").className = '';
       document.getElementById("T2").className = '';
       serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
    }else if(test == 10){
        document.getElementById("T2D").className = '';
        document.getElementById("T3").className = '';
        serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
    }else if(test>14){
        document.getElementById("T3D").className = '';
        errorHandler('Testing finished!');
        serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
    }
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
window.addEventListener('unload', messageSend, false);

function messageSend(){
    serverConnection.send(JSON.stringify({'log': log, 'uuid': uuid}));
    serverConnection.close();
}