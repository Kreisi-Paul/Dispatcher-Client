let auth = new Object();
let logoutTimer = 5;
let logoutClock;
let localUsers;
let selectedPager;
window.electronAPI.getVersion();
window.electronAPI.getAuth();
window.electronAPI.getSettings();

selectSetting("sound");//standard settings menu
selectPager(document.querySelector("span[data-pager='pager_s_touchscreen']"));

window.electronAPI.mainProc((event, arg) => {
    //console.log(event, arg)

    if (Object.keys(arg).includes("auth")) {
        auth.user_key = arg.auth.user_key;
        auth.user_ident = arg.auth.user_ident;
        console.log(auth)
        setTimeout(confirmAuth, 1000);
    }
    if (Object.keys(arg).includes("version")) {
        document.querySelector("#loading_version").innerHTML = `${arg.version}<br><b>made with ♥ by Kreisi</b>`;
        document.querySelector("#settings_version").innerHTML = `<b>${arg.version}</b><br>Mehr Informationen unter <b>www.kreisi.net</b>`;
    }
    if (Object.keys(arg).includes("settings")) {
        if (arg.settings.lst_volume)
            setSlider(arg.settings.lst_volume, document.querySelector("span[data-setting=lst_volume]"));
        if (arg.settings.soundset)
            setSelector(arg.settings.soundset, document.querySelector("span[data-setting=soundset]"));
        if (arg.settings.devmode)
            document.querySelector("#devmode_toggle").classList.add("toggled");
        if(arg.settings.pagersRestricted) {
            document.querySelectorAll(".pagerBtns").forEach((el)=>{el.classList.add("locked")});
        }
    }
})


function displayError(message, duration) {
    let errorDiv = document.querySelector("#error");

    errorDiv.style.display = "flex";
    errorDiv.children.item(0).innerHTML = message;

    setTimeout(() => {
        errorDiv.style.display = "none";
        errorDiv.children.item(0).innerHTML = "";
    }, duration);
}


function openPager(faction, unit) {
    if (faction == "rd") {
        window.electronAPI.sendMsg({ "unit": unit });
        requestWindow({ "pager": ["rd", selectedPager] });
    }
    else {
        window.electronAPI.sendMsg({ "unit": unit });
        requestWindow({ "pager": ["pol", selectedPager] });
    }
}

function requestWindow(wType) {
    console.log("opening window:", wType);
    window.electronAPI.sendMsg(wType);
}

async function updateUnitList(faction) {
    let table = document.querySelector("#unit_select_table");


    //clear table
    table.innerHTML = "";


    //get data
    let response = await fetch(`https://dispatch.kreisi.net/getvehicles/${encodeURIComponent(faction)}?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
    let unitList = await response.json();
    console.log(unitList)


    //fill table
    let sortedUnitList = sortUnitList(unitList);

    for (let i = 0, iLength = Object.keys(sortedUnitList).length; i < iLength; i++) {
        console.log(sortedUnitList[Object.keys(sortedUnitList)[i]])
        table.innerHTML +=
            `<span class="unitListArea">
                    ${makeSafe(Object.keys(sortedUnitList)[i])}
                </span>`

        //let areaSpan = document.querySelector(`span[data-area=${Object.keys(sortedUnitList)[i]}]`);
        let areaUnits = sortedUnitList[Object.keys(sortedUnitList)[i]];
        //console.log(Object.keys(areaUnits).length)


        for (let j = 0, jLength = Object.keys(areaUnits).length; j < jLength; j++) {
            //console.log(Object.keys(areaUnits)[j])
            table.innerHTML += `
            <span class="unitListUnit">
                <span class="unitInfo">
                    <span class="unitName">${makeSafe(Object.keys(areaUnits)[j])}</span>
                    <span><span class="material-symbols-outlined" title="eingeloggte Mitarbeiter">group</span> : ${areaUnits[Object.keys(areaUnits)[j]].users.length}</span>
                    <span><span class="material-symbols-outlined" title="Status">cell_tower</span> : ${areaUnits[Object.keys(areaUnits)[j]].status}</span>
                </span>
                <span class="material-symbols-outlined unitJoin" onclick="openPager('${faction}','${makeSafe(Object.keys(areaUnits)[j])}')">open_in_new</span>
            </span>`;
        }
    }
}


function openUnitSelection(faction) {
    console.log(faction)
    document.querySelector("#unit_selection").style.display = "flex";
    updateUnitList(faction);
}

function closeUnitSelection() {
    document.querySelector("#unit_selection").style.display = "none";
}

async function confirmAuth() {
    let response = await fetch(`https://dispatch.kreisi.net/checkauth?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);

    if (response.status == 200) {//lädt Username, schließt Ladebildschirm
        document.querySelector("#loading_status").innerText = "Authorisierung erfolgreich";
        setTimeout(async () => {
            let userResponse = await fetch(`https://dispatch.kreisi.net/getusername?user_ident=${encodeURIComponent(auth.user_ident)}`);
            let username = await userResponse.text();
            document.querySelector("#welcome").innerText = `Hallo, ${username}`;
            document.querySelector("#loading_version").style.display = "none";
            document.querySelector("#loading").style.display = "none";
        }, 3000);
    }
    else {
        document.querySelector("#loading_status").innerHTML = `Authorisierung fehlgeschlagen (${response.status})`;
        setTimeout(async () => {
            document.querySelector("#login").style.display = "flex";
        }, 3000);
    }
}

async function login() {
    document.querySelector("#login_btn").disabled = true;
    document.querySelector("#code_login_btn").disabled = true;
    let username = document.querySelector("#login_username").value;
    let password = await hashDigest(document.querySelector("#login_password").value);
    let response = await fetch(`https://dispatch.kreisi.net/login?ident=${username}&password=${password}`);

    if (response.status == 200) {
        window.electronAPI.sendMsg({"set_setting": ["pagersRestricted", false]});
        window.electronAPI.getSettings();
        window.electronAPI.setAuth({"user_ident": username, "user_key": await response.text()});
        window.electronAPI.getAuth();

        setTimeout(() => {
            closeLogin();
            confirmAuth();
        }, 2000);
    }
    else {
        closeLogin();
        confirmAuth();
    }
}
async function hashDigest(data) {
    let encoder = new TextEncoder();
    let dataEnc = encoder.encode(data);
    let result;

    await crypto.subtle.digest("SHA-256", dataEnc).then((dataBuffer) => {
        let hashArray = Array.from(new Uint8Array(dataBuffer));
        result = hashArray
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
    })

    return result;
}

async function loginWithCode() {
    document.querySelector("#login_btn").disabled = true;
    document.querySelector("#code_login_btn").disabled = true;
    let logincode = document.querySelector("#login_code").value;
    let response = await fetch(`https://dispatch.kreisi.net/loginwithkey?login_key=${logincode}`);

    if (response.status == 200) {
        let result = await response.json();
        window.electronAPI.sendMsg({"set_setting": ["pagersRestricted", true]});
        window.electronAPI.getSettings();
        window.electronAPI.setAuth({"user_ident": result.user_ident, "user_key": result.user_key});
        window.electronAPI.getAuth();

        setTimeout(() => {
            closeLogin();
            confirmAuth();
        }, 2000);
    }
    else {
        closeLogin();
        confirmAuth();
    }

}

function closeLogin() {
    document.querySelector("#login_username").value = "";
    document.querySelector("#login_password").value = "";
    document.querySelector("#login_code").value = "";
    document.querySelector("#login_btn").disabled = false;
    document.querySelector("#code_login_btn").disabled = false;
    document.querySelector("#login").style.display = "none";
}

function openSettings() {
    document.querySelector("#settings").style.display = "flex";
}
function closeSettings() {
    document.querySelector("#settings").style.display = "none";
}

function showLogout() {
    document.querySelector("#logout_confirm").style.display = "flex";
}
function hideLogout() {
    document.querySelector("#logout_confirm").style.display = "none";
}

function startLogoutTimer(el) {
    logoutClock = setInterval(() => {
        if (logoutTimer > 1) {
            logoutTimer = logoutTimer - 1;
            el.innerText = logoutTimer;
        }
        else {
            el.innerText = "Abmelden";
        }
    }, 1000);
    el.innerText = logoutTimer;
}
function resetLogoutTimer(el) {
    clearInterval(logoutClock);
    logoutTimer = 5;
    el.innerText = "Abmelden";
}
function logoutBtn() {
    if (logoutTimer == 1)
        logout();
}

function logout() {
    window.electronAPI.setAuth({ "user_ident": null, "user_key": null });
    location.reload();
}

function selectSetting(setting) {
    //hide all settings
    document.querySelectorAll("#settings_content > div").forEach((el) => { el.style.display = "none" });
    document.querySelectorAll(`#settings_nav > span`).forEach((el) => { el.style.textDecoration = "" });

    //show correct settings
    document.querySelector(`#settings_content > div[data-settings="${setting}"]`).style.display = "";
    document.querySelector(`#settings_nav > span[data-settings="${setting}"]`).style.textDecoration = "underline 2px";
}

function sliderEvent(event) {
    //console.log(event)
    if (event.target.dataset.setting) {//set slider
        //console.log(event.target.children.item(0))
        //console.log(event.target.dataset.setting)

        let sliderValue = Math.round((event.offsetX / event.target.clientWidth) * 100) / 100

        //snapping
        if (sliderValue - 0.04 < 0)
            sliderValue = 0;
        if (sliderValue + 0.04 > 1)
            sliderValue = 1;

        if (event.target.dataset.setting == "lst_volume") {
            let audioEl = document.querySelector("audio");
            audioEl.volume = sliderValue;
            audioEl.src = "../src/soundset_0/beep.mp3";
            audioEl.play();
        }

        //console.log("prozentwert", sliderValue)
        setSlider(sliderValue, event.target);
        window.electronAPI.sendMsg({ "set_setting": [event.target.dataset.setting, sliderValue] });
    }
    else {//grab slider
        //console.log("slide")
        //TODO
    }
}

function setSlider(value, el) {
    el.children.item(0).style.marginLeft = `${Math.min(Math.max(value * 100, 1), 99)}%`;
}

function selectorEvent(el, event) {
    //console.log(el,event)

    if (event.target.dataset.option) {//set option
        if (el.dataset.setting) {
            if (el.dataset.setting == "soundset") {
                let audioEl = document.querySelector("audio");
                audioEl.volume = 0.1;
                audioEl.src = `../src/${event.target.dataset.option}/beep.mp3`;
                audioEl.play();
            }
            window.electronAPI.sendMsg({ "set_setting": [el.dataset.setting, event.target.dataset.option] });
        }
        else if (el.dataset.edit_user) {
            if (!editUser(el.dataset.edit_user, event.target.dataset.option))
                return;//do not update selector values when request fails
        }

        //collapse
        el.children.item(0).children.item(1).innerText = "expand_more";
        el.children.item(1).style.display = "none";

        //set selector value
        setSelector(event.target.dataset.option, el);
    }
    else if (event.target.classList.contains("collapseSelector")) {//collapse/expand
        if (event.target.innerText == "expand_more") {//expand
            event.target.innerText = "expand_less";
            el.children.item(1).style.display = "flex";
        }
        else {//collapse
            event.target.innerText = "expand_more";
            el.children.item(1).style.display = "none";
        }
    }
}

function setSelector(value, el) {
    el.children.item(0).children.item(0).innerText = value;
}


async function getUserList() {
    let response = await fetch(`https://dispatch.kreisi.net/getusers?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
    if (response.status == 200) {
        let responseData = await response.json();
        updateUserList(responseData);
        localUsers = responseData;
    }
}

function updateUserList(users) {
    let userList = "";

    for (let i = 0, iLength = Object.keys(users).length; i < iLength; i++) {
        let tmpUser = users[Object.keys(users)[i]];
        //console.log(users[Object.keys(users)[i]])

        if (Object.keys(users)[i] == auth.user_ident && (tmpUser.permissionLvlRD > 1 || tmpUser.permissionLvlPOL > 1))
            document.querySelector("#manage_users > span").children.item(1).style.display = "flex";

        userList += `
        <span data-userident="${Object.keys(users)[i]}">
            <span>
                <span>
                    <span class="material-symbols-outlined">badge</span>
                    <span><b>${makeSafe(tmpUser.name)}</b></span>
                </span>
                <span>
                    <span class="material-symbols-outlined">military_tech</span>
                    <span>${makeSafe(tmpUser.rank)}</span>
                </span>
            </span>
            <span class="userRanks">
                <span>
                    <span class="material-symbols-outlined">medical_services</span>
                    <span>${tmpUser.permissionLvlRD}</span>
                </span>
                <span>
                    <span class="material-symbols-outlined">local_police</span>
                    <span>${tmpUser.permissionLvlPOL}</span>
                </span>
            </span>
            <span class="userButtons">
                <span class="material-symbols-outlined" onclick="openUserEdit(this.parentNode.parentNode.dataset.userident)">person_edit</span>
                <span class="material-symbols-outlined" onclick="openUserDeletion(this.parentNode.parentNode.dataset.userident)">person_remove</span>
            </span>
        </span>`;
    }

    document.querySelector("#manage_users > div").innerHTML = userList;
}

function collapseUserList() {
    let userlist = document.querySelector("#manage_users");
    if (userlist.children.item(1).style.display == "flex") {
        userlist.children.item(1).style.display = "none";
        userlist.children.item(0).children.item(32).innerText = "expand_more";
    }
    else {
        getUserList();
        userlist.children.item(1).style.display = "flex";
        userlist.children.item(0).children.item(3).innerText = "expand_less";
    }
}

function getUserTracking() {
    try {
        navigator.clipboard.writeText(`https://dispatch.kreisi.net/tracking?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
        displayError("URL erfolgreich kopiert", 4000);
    }
    catch {
        displayError("URL konnte nicht kopiert werden", 4000);
    }
}

function openUserCreation() {
    document.querySelector("#create_user").style.display = "flex";
    document.querySelector("#create_user input[data-value='new_ident']").value = "";
    document.querySelector("#create_user input[data-value='new_name']").value = "";
}
function closeUserCreation() {
    document.querySelector("#create_user").style.display = "none";
}
async function createUser() {
    let newUser = {
        "ident": document.querySelector("#create_user input[data-value='new_ident']").value,
        "name": document.querySelector("#create_user input[data-value='new_name']").value
    }

    if (!newUser.ident || !newUser.name) {
        displayError("Bitte füllen Sie alle Felder aus.", 6000);
        return;
    }

    let response = await fetch(`https://dispatch.kreisi.net/createuser?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&new_ident=${encodeURIComponent(newUser.ident)}&new_name=${encodeURIComponent(newUser.name)}`);

    if (response.status != 200) {
        displayError(`Anfrage fehlgeschlagen.<br>(${response.status})`, 6000);
        return;
    }

    closeUserCreation();
    getUserList();
}

function openUserEdit(userIdent) {
    //set ident
    document.querySelector("#edit_user > div > span").innerText = userIdent;

    //set values
    document.querySelector("#edit_name").value = localUsers[userIdent].name;
    document.querySelector("#edit_user span[data-edit_user='change_rank'] .activeSelector").innerText = localUsers[userIdent].rank || "-- / --";
    document.querySelector("#edit_user span[data-edit_user='change_perm_rd'] .activeSelector").innerText = localUsers[userIdent].permissionLvlRD;
    document.querySelector("#edit_user span[data-edit_user='change_perm_pol'] .activeSelector").innerText = localUsers[userIdent].permissionLvlPOL;

    //open window
    document.querySelector("#edit_user").style.display = "flex";
}
function closeUserEdit() {
    document.querySelector("#edit_user").style.display = "none";
}
async function editUser(category, value) {
    //console.log(category,value)
    let changeIdent = document.querySelector("#edit_user > div > span").innerText;

    let response = await fetch(`https://dispatch.kreisi.net/edituser?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&change_ident=${encodeURIComponent(changeIdent)}&${encodeURIComponent(category)}=${encodeURIComponent(value)}`);

    if (response.status == 200) {
        getUserList();


        if (category == "reset_password")
            navigator.clipboard.writeText(`https://dispatch.kreisi.net/register?${encodeURIComponent(changeIdent)}`);

        return true;
    }
    else {
        displayError(`Wert konnte nicht geändert werden<br>(${response.status},${category})`, 6000);
        return false;
    }
}

function openUserDeletion(userIdent) {
    //console.log(userIdent)
    let el = document.querySelector("#delete_user > div > span");

    el.innerText = localUsers[userIdent].name;
    el.dataset.deleteident = userIdent

    document.querySelector("#delete_user").style.display = "flex";
}
function closeUserDeletion() {
    document.querySelector("#delete_user").style.display = "none";

    let el = document.querySelector("#delete_user > div > span");

    el.innerText = "ERROR";
    el.dataset.deleteident = "ERROR"
}
async function deleteUser() {
    let deleteUser = document.querySelector("#delete_user > div > span").dataset.deleteident;

    if (!deleteUser)
        displayError("Nutzer konnte nicht gelöscht werden.", 6000);

    let response = await fetch(`https://dispatch.kreisi.net/deleteuser?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&delete_ident=${encodeURIComponent(deleteUser)}`);

    if (response.status != 200) {
        displayError(`Nutzer konnte nicht gelöscht werden.<br>(${response.status})`, 6000);
        return;
    }

    closeUserDeletion();
    getUserList();
}

function selectPager(el) {
    selectedPager = el.dataset.pager;

    let pagerEls = document.querySelectorAll("#pager_select_table > span");
    for (let i = 0, iLength = pagerEls.length; i < iLength; i++) {
        pagerEls[i].children[0].style.textDecoration = "";
    }

    el.children[0].style.textDecoration = "underline";
}

function restrictInput(el, { "regex": regex, "length": length }) {
    let elValue = el.value;
    //console.log(el, regex,length)

    // apply regex filter
    elValue = elValue.replace(regex, "");

    //apply length filter
    elValue = elValue.slice(0, length);

    el.value = elValue;
}

function toggleDevTools() {
    let toggle = document.querySelector("#devmode_toggle");

    if (toggle.classList.contains("toggled")) {
        window.electronAPI.sendMsg({ "set_setting": ["devmode", false] });
        toggle.classList.remove("toggled");
    }
    else {
        window.electronAPI.sendMsg({ "set_setting": ["devmode", true] });
        toggle.classList.add("toggled");
    }
}