let soundset;
let openApps = new Set();
let pagerSettings = new Object();
let activeJobId = false;
let sosStatus = false;
let notificationShown = false;
const appInfo = {
    "alarm": {
        name: "Alarminfo",
        icon: "notifications_active"
    },
    "maps": {
        name: "Lagekarten",
        icon: "map"
    },
    "status": {
        name: "Status",
        icon: "cell_tower"
    },
    "follow_up": {
        name: "Nachalarm",
        icon: "e911_emergency"
    },
    "messages": {
        name: "Nachrichten",
        icon: "contact_emergency"
    },
    "settings": {
        name: "Einstellungen",
        icon: "settings"
    }
};
let appStorage = {
    "messages": {

    },
    "maps": {

    }
};





/* INIT */

function initPager() {
    window.electronAPI.pagerSettings(["get", "pager_l_touchscreen"]);
    window.electronAPI.getSettings();
}
function loadPagerSettings(newSettings) {
    console.log(newSettings)

    if (newSettings) {//apply saved options
        setOpacity(newSettings.opacity);
        setVolume(newSettings.volume);
    }
    else {//apply standard options
        setOpacity(6);
        setVolume(1);
    }
}
function loadSettings(newSettings) {
    soundset = newSettings.soundset;
}


/* SETTINGS */

function setOpacity(newOpacity) {
    let opacitySettings = [
        0.2,
        0.3,
        0.4,
        0.5,
        0.6,
        0.8,
        1
    ];

    //return if old value is selected
    if (pagerSettings.opacity == newOpacity)
        return;

    //change opacity via main process
    window.electronAPI.pagerSettings(["opacity", opacitySettings[newOpacity]]);

    //only save settings if settings were already initialized
    if (pagerSettings.opacity) {
        pagerSettings.opacity = newOpacity;
        window.electronAPI.pagerSettings(["set", ["pager_l_touchscreen", pagerSettings]]);
    }
    else
        pagerSettings.opacity = newOpacity;
}

function setVolume(newVolume) {
    let volumeSettings = [
        [0, "notifications_off"],
        [0.05, "notifications"],
        [0.1, "notifications"],
        [0.15, "notifications"],
        [0.2, "notifications_active"],
        [0.4, "notifications_active"],
        [0.6, "notifications_active"]
    ];
    console.log("new volume", newVolume)

    //return if old value is selected
    if (pagerSettings.volume == newVolume)
        return;

    //change volume, volume indicator
    document.querySelector("#audio").volume = volumeSettings[newVolume][0];
    document.querySelector("#status_sound").innerText = volumeSettings[newVolume][1];


    //only save settings if settings were already initialized
    if (pagerSettings.volume) {
        pagerSettings.volume = newVolume;
        window.electronAPI.pagerSettings(["set", ["pager_l_touchscreen", pagerSettings]]);
        playSound("beep");//preview sound
    }
    else
        pagerSettings.volume = newVolume;
}


/* NAVBAR / STATUSBAR*/

function navButton(button) {

    //general actions
    closeNotificationTray();
    closeAppManagement();

    //specific actions
    switch (button) {
        case "splitscreen":

            break;
        case "back":

            break;
        case "home":
            document.querySelectorAll(".appFullscreen, .appLeft, .appRight").forEach((el) => { el.classList.remove("appFullscreen", "appLeft", "appRight") });//closes every open app
            break;
        case "menu":
            openAppManagement();
            break;
    }
}

function openNotificationTray() {
    document.querySelector("#notification_tray").style.display = "flex";
}
function closeNotificationTray() {
    document.querySelector("#notification_tray").style.display = "none";
}

function openAppManagement() {
    document.querySelector("#active_apps").style.display = "flex";
}
function closeAppManagement() {
    document.querySelector("#active_apps").style.display = "none";
}

/**
 * creates a notification for a specified app
 * @param {string} app appname
 * @param {string} content a **safe** string that shows up below the app name
 */
function createNotification(app, content) {
    if (content.length > 40) {//limit content to 40 chars
        content = content.slice(0, 36);
        content += "..."
    }

    let notificationEl = `
            <div>
                <span class="notificationDelete material-symbols-outlined" onclick="deleteNotification(this.parentNode)">close</span>
                    <span class="notificationInfo">
                        <span class="notificationIcon material-symbols-outlined" data-app="${app}">${appInfo[app].icon}</span>
                        <p>${appInfo[app].name}</p>
                    </span>
                    <span class="notificationContent">${content}</span>
                    <span class="notificationTime">${new Date(Date.now()).toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>`;

    if (!notificationShown) {
        notificationShown = true;
        let activeNotification = document.querySelector("#active_notification");

        activeNotification.innerHTML = `
                <span class="notificationInfo">
                    <span class="notificationIcon material-symbols-outlined" data-app="${app}">${appInfo[app].icon}</span>
                    <p>${appInfo[app].name}</p>
                </span>
                <span class="notificationContent">${content}</span>`;

        activeNotification.classList.add("active");

        setTimeout(() => {
            activeNotification.classList.remove("active");
            activeNotification.innerHTML = "";
            notificationShown = false;
        }, 8000);
    }

    if (!document.querySelector(`#status_notifications span[data-app="${app}"]`)) {//only add icon if none if "app" is already present
        document.querySelector("#status_notifications").innerHTML += `<span data-app="${app}" class="material-symbols-outlined">${appInfo[app].icon}</span>`;
    }

    document.querySelector("#notification_tray").innerHTML += notificationEl;
}

function deleteNotification(el) {
    let app = el.children.item(1).children.item(0).dataset.app;
    el.remove();//remove notification

    if (!document.querySelector(`#notification_tray span[data-app="${app}"]`))//remove icon if no other notifications of app are present
        document.querySelector(`#status_notifications span[data-app="${app}"]`).remove();

    if (!document.querySelector(`#notification_tray div`))
        closeNotificationTray();
}

function triggerSOS() {
    sosStatus = null;
    setTimeout(() => {
        if (sosStatus == null) {
            document.querySelector("#sos_btn").classList.add("sosBtnReady");
            sosStatus = true;
        }
    }, 2000);
}

function sendSOS(confirm) {
    if (sosStatus && confirm) {
        sendStatus(9);
    }
    sosStatus = false;
    document.querySelector("#sos_btn").classList.remove("sosBtnReady");
}



/* APP MANAGEMENT */

function openApp(appName, data) {
    closeAppManagement()//close app management in case a shortcut from that menu was used
    //console.log(appName, data)


    try {//run app-specific code when it is not yet initialized
        if (!appStorage[appName].init) {
            switch (appName) {
                case "messages":
                    fetch(`https://dispatch.kreisi.net/getvehicles/${userAuth.faction}?user_ident=${encodeURIComponent(userAuth.user_ident)}&user_key=${encodeURIComponent(userAuth.user_key)}`).then(async (response) => {
                        if (response.status != 200)
                            return;

                        let units = await response.json();
                        let contactEls = `
                            <span onclick="switchChat(this.children.item(1).innerText)">
                                <span class="material-symbols-outlined">cell_tower</span>
                                <p>Leitstelle</p>
                                <span class="unreadMessage unread"></span>
                            </span>
                            <hr>`;
                        appStorage.messages.chats = {
                            "Leitstelle": [
                                ["sent", "Das wurde gesendet", "12:00"],
                                ["recieved", "Ich habs gesehn", "12:01"],
                                ["recieved", "Ist gut", "12:02"],
                                ["sent", "Ne seh ich nicht so", "12:03"]
                            ]
                        };
                        appStorage.messages.init = true;

                        delete units[userAuth.unit];//delete own unit

                        for (let i = 0, iLength = Object.keys(units).length; i < iLength; i++) {

                            appStorage.messages.chats[Object.keys(units)[i]] = [];

                            contactEls += `
                                <span onclick="switchChat(this.children.item(1).innerText)">
                                    <span class="material-symbols-outlined">minor_crash</span>
                                    <p>${makeSafe(Object.keys(units)[i])}</p>
                                    <span class="unreadMessage"></span>
                                </span>
                                `;
                            if (i + 1 != iLength)
                                contactEls += "<hr>";
                        }

                        document.querySelector("#messages_contacts").innerHTML = contactEls;
                    })
                    switchChat("");
                    break;
            }
        }
    } catch { }

    //show app
    document.querySelector(`#apps > div[data-app="${appName}"]`).classList.add("appFullscreen");

    //add app to active apps
    if (!openApps.has(appName)) {
        openApps.add(appName);
        document.querySelector("#active_apps_list").innerHTML += `
                <span class="activeApp" data-app="${appName}">
                    <span class="activeAppActions">
                        <span class="material-symbols-outlined" title="App schließen" onclick="closeApp('${appName}')">close</span>
                        <span class="material-symbols-outlined" title="Appinformationen">info</span>
                        <span class="material-symbols-outlined" title="In Spiltscreen-Modus öffnen">splitscreen_right</span>
                    </span>
                    <span class="appIcon material-symbols-outlined" onclick="openApp('${appName}')">${appInfo[appName].icon}</span>
                    <span class="appName">${appInfo[appName].name}</span>
                </span>`;
    }
}

function closeApp(appName) {
    //hide app
    document.querySelector(`#apps > div[data-app="${appName}"]`).classList.remove("appFullscreen", "appLeft", "appRight");

    //remove app from active apps
    openApps.delete(appName);
    document.querySelector(`#active_apps_list .activeApp[data-app="${appName}"]`).remove();

    //try to clear app storage
    try {
        appStorage[appName] = {};
    }
    catch { }
}



/* APPS */

function switchChat(chat) {
    let chatDiv = document.querySelector("#messages_chat");
    chatDiv.innerHTML = "";
    let messagesEl = "";

    document.querySelector("#messages_input input").value = "";
    document.querySelector("#messages_mainmenu p").innerText = chat;

    for (let i = 0, iLength = appStorage.messages.chats[chat].length; i < iLength; i++) {
        let tmpMessage = appStorage.messages.chats[chat][i];
        messagesEl += `
                <span class="messageBubble ${tmpMessage[0]}">
                <span class="messageContent">${makeSafe(tmpMessage[1])}</span>
                <span class="messageTimestamp">${tmpMessage[2]}</span>
                </span>`;
    }

    chatDiv.innerHTML = messagesEl;

    chatDiv.scrollTop = chatDiv.scrollHeight;//scroll to bottom
}

function sendChatMsg() {
    let input = document.querySelector("#messages_input input");
    let target = document.querySelector("#messages_mainmenu p").innerText;

    if (!input.value || !target)
        return;

    sendSocket({ "msg": [target, input.value, userAuth.unit] });

    appStorage.messages.chats[target].push([//save sent message
        "sent",
        input.value,
        new Date(Date.now()).toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" })
    ]);

    switchChat(target);//refresh chat

    input.value = "";
}

function recieveChatMsg(message) {
    let newMsg = [
        "recieved",
        message[0],
        new Date(Date.now()).toLocaleTimeString("de", { hour: "2-digit", minute: "2-digit" })
    ];

    console.log(appStorage.messages.chats)
    appStorage.messages.chats[message[1]].push(newMsg);

    if (document.querySelector("#messages_mainmenu p").innerText == message[1])//update chat when user is currently looking at it
        switchChat(message[1]);

    if (document.querySelector(".app[data-app='messages']").classList.contains("appFullscreen")) {

    }
    else {
        createNotification("messages", `Nachricht von ${makeSafe(message[1])}: ${message[0]}`);
    }
}









/* COMMUNICATION */

function connectionUpdate(connection) {
    if (connection) {
        document.querySelector("#status_connection").innerText = "signal_cellular_3_bar";
        document.querySelector("#unit_status").innerText = userAuth.unit;
    }
    else
        document.querySelector("#status_connection").innerText = "signal_cellular_nodata";
}

function statusUpdate(newStatus) {
    document.querySelector("#active_status").innerText = newStatus;
    document.querySelector("#status_active").classList = [`status${newStatus}`];
}

function jobUpdate(newJobId) {
    let jobUpdated; //for preventing new_call sound

    //clear previous job
    document.querySelector("span[data-job=title]").innerText = "--- / ---";
    document.querySelector("span[data-job=location]").innerText = "--- / ---";
    document.querySelector("span[data-job=caller]").innerText = "--- / ---";
    document.querySelector("span[data-job=comment]").innerText = "--- / ---";
    document.querySelector("span[data-job=timestamp]").innerText = "--- / ---";
    document.querySelector("div[data-job=units]").innerHTML = "";
    //play sound
    if (newJobId == false) {
        playSound("no_job");
    }
    else if (newJobId == activeJobId) {
        createNotification("alarm", "Einsatzinformationen aktualisiert.")
        jobUpdated = true;
    }

    //update active job id
    activeJobId = newJobId;

    if (newJobId == false)
        return

    /*
    //display wait message, remove error message if needed
    document.querySelector("#job_download_fail").style.display = "none";
    document.querySelector("#job_download").style.display = "flex";
    */

    fetch(`https://dispatch.kreisi.net/getjobinfo?id=${newJobId}&user_faction=${userAuth.faction}&user_ident=${encodeURIComponent(userAuth.user_ident)}&user_key=${encodeURIComponent(userAuth.user_key)}`).then(async (response) => {
        console.log(response)
        if (response.status != 200) {
            createNotification("alarm", "Einsatzinfo konnte nicht empfangen werden!")
            return;
        }
        let newJob = await response.json();


        //play appropriate sound
        if (!jobUpdated) {
            switch (newJob.urgency) {
                case "R1":
                    playSound("new_job_1");
                    break;
                case "R2":
                    playSound("new_job_2");
                    break;
                case "R3":
                    playSound("new_job_3");
                    break;
                default:
                    playSound("new_job_2");
            }
            createNotification("alarm", `Neuer Einsatz: <b>${makeSafe(newJob.title)}</b>`)
        }

        //set new job info if available
        document.querySelector("span[data-job=title]").innerHTML = `<b>${makeSafe(newJob.urgency)}</b>${makeSafe(newJob.title)}`;
        document.querySelector("span[data-job=location]").innerText = newJob.location || "-/-";
        document.querySelector("span[data-job=caller]").innerText = newJob.caller || "-/-";
        document.querySelector("span[data-job=comment]").innerText = newJob.msg || "-/-";
        document.querySelector("span[data-job=timestamp]").innerText = new Date(parseInt(newJobId)).toLocaleTimeString("de");

        setTimeout(() => {
            fetch(`https://dispatch.kreisi.net/getvehicles/${userAuth.faction}?user_ident=${encodeURIComponent(userAuth.user_ident)}&user_key=${encodeURIComponent(userAuth.user_key)}`).then(async (response) => {
                response.json().then((units) => {
                    let jobUnits = "";

                    for (let i = 0, iLength = Object.keys(units).length; i < iLength; i++) {
                        if (units[Object.keys(units)[i]].job == newJobId) {
                            jobUnits += `<span>- ${makeSafe(Object.keys(units)[i])}</span>`;
                        }
                    }
                    document.querySelector("div[data-job=units]").innerHTML = jobUnits;//update unit list
                });
            });
        }, 5000);
    });
}


/* SOUND */

function playSound(soundName) {
    let audioEl = document.querySelector("#audio");

    audioEl.src = `../src/${soundset}/${soundName}.mp3`;
    audioEl.play();
}
