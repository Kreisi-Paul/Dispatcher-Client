connectionUpdate(false);
let socket;
openSocket();


function openSocket() {
    console.log("foo")
    socket = new WebSocket("wss://limnossocket.kreisi.net");

    // Connection opened
    socket.addEventListener('open', () => {
        connectionUpdate(true); //to pager
        console.log("socket opened");
        //keepSocketAlive();
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

/* --- Communication --- */

function sendStatus(status) {
    sendSocket({"status":status});
}