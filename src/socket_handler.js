connectionUpdate(false);
let socket;
let userAuth = new Object();
let reconnection = false;

onload = ()=> {
    window.electronAPI.sendMsg("getfaction");
    window.electronAPI.sendMsg("getunit");
    setTimeout(()=>{
        window.electronAPI.getAuth();
    },5000);
}

//listen for main process
window.electronAPI.mainProc((event, arg)=>{
    console.log(event, arg)

    if(Object.keys(arg).includes("auth")) {
        userAuth.user_key = arg.auth.user_key;
        userAuth.user_ident = arg.auth.user_ident;
        openSocket();//opens socket after pager recieved auth
    }
    if(Object.keys(arg).includes("faction")) {
        userAuth.faction = arg.faction;
    }
    if(Object.keys(arg).includes("unit")) {
        userAuth.unit = arg.unit;
    }
})



function openSocket() {
    console.log("opening socket")
    socket = new WebSocket("wss://limnos.kreisi.net");

    // Connection opened
    socket.addEventListener('open', () => {
        console.log("socket opened");
        sendSocket({"login":userAuth.unit});
        connectionUpdate(true); //to pager
        syncPager();
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
        if(socket.readyState == 1)
            ping();
        else
            delete this;
    }, 10000);
}

/* --- Communication --- */

function sendStatus(status) {
    sendSocket({"set_status":status});
}

function syncPager() {
    sendSocket({"update":"status"});
    sendSocket({"update":"job"});
}