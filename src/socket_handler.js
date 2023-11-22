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
    socket.addEventListener('message', (event) => {
        console.log(event)
        if(event.data.toString() == "pong")
            console.log("pong")
        else
            handleSocketMsg(event.data.toString());
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

function ping() {
    socket.send("ping");
}