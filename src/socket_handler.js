connectionUpdate(false);
let socket;
let userAuth = {
    "faction":"rdil",
    "unit":"NEF01-KAV",
    "user_ident":"paul_kreismann",
    "user_key":"eofbup4983bfnp984npo9btro5n06i8tbn"
}
openSocket();


function openSocket() {
    console.log("foo")
    socket = new WebSocket("wss://limnos.kreisi.net");

    // Connection opened
    socket.addEventListener('open', () => {
        console.log("socket opened");
        sendSocket({"login":"NEF01-KAV"});
        connectionUpdate(true); //to pager
        keepSocketAlive();
    });

    // Connection closed
    socket.addEventListener('close', (event) => {
        connectionUpdate(false); //to pager
        console.warn("Socket closed:", event);
        reconnectSocket(3);
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

function reconnectSocket (i) {

    if(i <= 0) {
        console.warn("reconnect unsuccessful");
    }
    else {
        if(socket.readyState != 1) {
            openSocket();
            setTimeout(() => {
                reconnectSocket(i-1);
            },7500);
        }
    }
}
/**
 * @param {Object} message 
 */
function sendSocket(message) {
    message.auth = userAuth;

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
            case "status":
                statusUpdate(content);
                return;

            case "job":
                jobUpdate(content);
                return;
        }
    }
}

function ping() {
    socket.send("ping");
}

function keepSocketAlive() {
    setInterval(()=>{
        ping();
    }, 10000);
}

/* --- Communication --- */

function sendStatus(status) {
    sendSocket({"set_status":status});
}