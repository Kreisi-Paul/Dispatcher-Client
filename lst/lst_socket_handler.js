connectionUpdate(false);
let socket;
let reconnection = false;
let pinging = false;


function openSocket() {
    console.log("opening socket")
    socket = new WebSocket("wss://limnos.kreisi.net");

    // Connection opened
    socket.addEventListener('open', () => {//TODO
        console.log("socket opened");
        sendSocket({"lst_login":true});
        connectionUpdate(true); //to pager
        syncLst();
        keepSocketAlive();
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
        connectionUpdate(false); //to pager
        console.warn("Socket closed:", event);
        reconnectSocket();
    });

    // Listen for messages
    socket.addEventListener('message', async (event) => {
        console.log(event)
        let message;
        if(typeof event.data == "object")
            message = await event.data.text();
        else
            message = event.data;
        handleSocketMsg(message);
    });
}

function reconnectSocket () {
    console.log("hahdag")
    if(!reconnection) {
        reconnection = true;
        setInterval(()=>{
            if(socket.readyState == 1) {
                reconnection = false;
                delete this;
            }
            else
                openSocket();
        }, 10000);
    }
}

/**
 * @param {Object} message 
 */
function sendSocket(message) {
    message.auth = auth;

    socket.send(JSON.stringify(message));
}

function handleSocketMsg(message) {
    console.log(message);
    let msgObj = JSON.parse(message);
    let msgKeys = Object.keys(msgObj);

    for(let i=0, iLength=msgKeys.length; i<iLength; i++) {
        console.log(msgKeys[i])
        processMessage([msgKeys[i],msgObj[msgKeys[i]]]);
    }

    function processMessage(msgObj) {
        let action = msgObj[0];
        let content = msgObj[1];
        switch (action) {
            case "lst_units":
                unitsUpdate(content);
                return;

            case "lst_jobs":
                jobUpdate(content);
                return;
        }
    }
}

function ping() {
    socket.send("ping");
}

function keepSocketAlive() {
    if(!pinging) {
        pinging = true;
        setInterval(()=>{
            ping();
        }, 20000);
    }
}

/* --- Communication --- */

function syncLst() {
    console.warn("syncing")
    sendSocket({"lst_update":"units"});
    sendSocket({"lst_update":"jobs"});
}