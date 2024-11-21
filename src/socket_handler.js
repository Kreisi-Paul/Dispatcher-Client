connectionUpdate(false);
let socket;
let userAuth = new Object();
let reconnection = false;
let pinging = false;
let lastPing = null;
let pingInterval = null;

onload = ()=> {
    initPager();//initialize pager settings
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
    if(Object.keys(arg).includes("pagersettings")) {
        loadPagerSettings(arg.pagersettings);
    }
    if(Object.keys(arg).includes("settings")) {
        loadSettings(arg.settings);
    }
})



function openSocket() {
    console.log("opening socket")
    socket = new WebSocket("wss://dispatch.kreisi.net");

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
    clearInterval(pingInterval)
    pinging = false;
    if(!reconnection) {
        reconnection = true;
        let interval = setInterval(()=>{
            if(socket.readyState == 1) {
                reconnection = false;
                clearInterval(interval);
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
    //console.log(message);
    let msgObj = JSON.parse(message);
    let msgKeys = Object.keys(msgObj);

    for(let i=0, iLength=msgKeys.length; i<iLength; i++) {
        //console.log(msgKeys[i])
        if(msgKeys[i] == "pong")
            updatePing(msgObj.pong);
        else
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
            
            case "lst_call":
                lstCall(content);
                return;

            case "lst_msg":
                lstMsg(content);
                return;

            case "msg":
                recieveChatMsg(content);
                return;
        }
    }
}

function ping() {
    socket.send("ping");
    if(lastPing == null) {
        lastPing = Date.now();
    }
}

function updatePing(pingTime) {
    let currentTime = Date.now();

    //ping displays in settings
    document.querySelector("#ping_0").innerText = `${pingTime - lastPing}ms`;
    document.querySelector("#ping_1").innerText = `${currentTime - pingTime}ms`;
    document.querySelector("#ping_2").innerText = `${currentTime - lastPing}ms`;
    lastPing = null;
}

function keepSocketAlive() {
    if(!pinging) {
        pinging = true;
        pingInterval = setInterval(ping, 20000);
    }
}

/* --- Communication --- */

function sendStatus(status) {
    sendSocket({"set_status":status});
}

function syncPager() {
    sendSocket({"update":"status"});
    sendSocket({"update":"job"});
}