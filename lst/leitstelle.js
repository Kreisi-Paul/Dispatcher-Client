let auth = new Object();
let unitCard;//saves the opened unit card target
let localUnits;
let localJobs;
let mapInfo = {
    x: 0,
    y: 0,
    zoom: 1000,
    panning: false,
    panOrigin: null,
    dimensions: null,
    targetMode: false
};

window.electronAPI.mainProc((event, arg) => {
    //console.log(event, arg)
    if (Object.keys(arg).includes("faction")) {
        auth.faction = arg.faction;
        document.querySelector("#faction_text").innerText = arg.faction.toUpperCase();
    }
    else if (Object.keys(arg).includes("auth")) {
        auth.user_ident = arg.auth.user_ident;
        auth.user_key = arg.auth.user_key;
    }
    else if (Object.keys(arg).includes("version")) {
        document.querySelector("#client_version").innerHTML = `${arg.version}<br><b>made with ♥ by Kreisi</b>`;
    }
})

onload = (event) => {
    console.log(event)
    window.electronAPI.getVersion();
    window.electronAPI.getAuth();
    window.electronAPI.sendMsg(["getfaction"]);
    setTimeout(() => {
        drawUnitList();
        setTimeout(openSocket, 2000);
    }, 2000);
}

//updates job timers 
setInterval(() => {
    try {
        let jobs = document.querySelectorAll(".jobListing");
        let currentDateNr = Date.now();

        for (let i = 0, iLength = jobs.length; i < iLength; i++) {
            let jobDateNr = jobs[i].dataset.id;

            let diff = currentDateNr - jobDateNr;

            if (diff > 86400000) {//>day
                if (Math.round(diff / 86400000) > 7)
                    jobs[i].children.namedItem("timestamp").innerText = "> 7 d";
                else
                    jobs[i].children.namedItem("timestamp").innerText = `${Math.round(diff / 86400000)} d`;
            }
            else if (diff > 3600000) {//hour
                jobs[i].children.namedItem("timestamp").innerText = `${Math.round(diff / 3600000)} h`;
            }
            else if (diff > 60000) {//>minute
                jobs[i].children.namedItem("timestamp").innerText = `${Math.round(diff / 60000)} min`;
            }
            else if (diff > 1000) {//>second
                jobs[i].children.namedItem("timestamp").innerText = `${Math.round(diff / 1000)} sec`;
            }
            else {
                jobs[i].children.namedItem("timestamp").innerText = "< 1 sec";
            }
        }
    }
    catch (e) {
        console.warn(e)
    }
}, 10000);


async function drawUnitList() {
    //get data
    let response = await fetch(`https://dispatch.kreisi.net/getvehicles/${encodeURIComponent(auth.faction)}?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
    let unitList = await response.json();
    //console.log(unitList)
    localUnits = unitList;


    //fill table
    let sortedUnitList = sortUnitList(unitList);
    //console.log(sortedUnitList)
    let unitGrid = document.querySelector("#unit_grid");


    for (let i = 0, iLength = Object.keys(sortedUnitList).length; i < iLength; i++) {//draw areas
        unitGrid.innerHTML += `
        <div class="areaDiv areaOpen" data-area="${makeSafe(Object.keys(sortedUnitList)[i])}">
            <span class="areaHeader">
                ${makeSafe(Object.keys(sortedUnitList)[i])}
                <span class="areaCollapse hoverButton" onclick="collapseArea('${makeSafe(Object.keys(sortedUnitList)[i])}')"><span class="material-symbols-outlined">expand_less</span></span>
            </span>
            <div class="unitGrid">
            </div>
        </div>
        `;

        let areaUnits = sortedUnitList[Object.keys(sortedUnitList)[i]];
        for (let j = 0, jLength = Object.keys(areaUnits).length; j < jLength; j++) {//draw units
            //console.log(areaUnits[Object.keys(areaUnits)[j]])
            /* TODO: where can these be used?
            RTW = Airport Shuttle [airport_shuttle]
            NEF = Vital Signs/Stethoscope [vital_signs] / [stethoscope]
            RTH = Helicopter [helicopter]
            FR = Minor Crash [minor_crash]
            LSAR = Health And Safety/Shield With House/Emergency [health_and_safety] / [shield_with_house] / [emergency]
            LAC = Home Repair Service [home_repair_service]
            Einsatzleitung = Sensor Occupied [sensor_occupied]
            PSNV = Cognition [cognition]
            */

            document.querySelector(`div[data-area="${makeSafe(Object.keys(sortedUnitList)[i])}"] > .unitGrid`).innerHTML += `
            <span class="unitTile status${areaUnits[Object.keys(areaUnits)[j]].status}" data-unit="${makeSafe(Object.keys(areaUnits)[j])}" onclick="openUnitCard(this.dataset.unit)">
                <span class="unitName">${makeSafe(Object.keys(areaUnits)[j])}</span>
                <span class="unitStatus"><span class="material-symbols-outlined">cell_tower</span> : <span class="fieldData">${areaUnits[Object.keys(areaUnits)[j]].status}</span></span>
                <span class="unitUsers"><span class="material-symbols-outlined">group</span> : <span class="fieldData">${areaUnits[Object.keys(areaUnits)[j]].users.length}</span></span>
            </span>
            `;
        }
    }

}

function collapseArea(area) {
    let areaDiv = document.querySelector(`div[data-area="${area}"]`);

    if (areaDiv.classList.contains("areaOpen")) {
        areaDiv.classList.remove("areaOpen");
        document.querySelector(`div[data-area="${area}"] > span > .areaCollapse > span`).innerText = "expand_more";
    }
    else {
        areaDiv.classList.add("areaOpen");
        document.querySelector(`div[data-area="${area}"] > span > .areaCollapse > span`).innerText = "expand_less";
    }
}

function openUnitCard(unitCardTarget) {
    unitCard = unitCardTarget;

    //set unit card info
    document.querySelector("#unit_card_title h2").innerText = unitCardTarget;
    document.querySelector("#unit_card_title").classList = [`status${localUnits[unitCardTarget].status}`];
    document.querySelector("#unit_card_usernumber").innerText = localUnits[unitCardTarget].users.length;
    document.querySelector("#unit_card_userlist").innerText = localUnits[unitCardTarget].users.join("\n");

    document.querySelector("#unit_card_sendmsg input").value = "";

    if (localUnits[unitCardTarget].job) {
        //show button to send multiple msgs
        document.querySelector("#unit_card_sendmsg span:nth-child(3)").style.display = "";

        try {
            document.querySelector("#unit_card_job").innerText = localJobs[localUnits[unitCardTarget].job].title;
            document.querySelector("#unit_card_joblink").style.display = "flex";
            document.querySelector("#unit_card_joblink").setAttribute("onclick", `openJobEdit(${localUnits[unitCardTarget].job})`);

            let rightCard = document.querySelector("#unit_card_right div");
            rightCard.children.item(0).children.namedItem("location").innerText = localJobs[localUnits[unitCardTarget].job].location || "-- / --";
            rightCard.children.item(1).children.namedItem("caller").innerText = localJobs[localUnits[unitCardTarget].job].caller || "-- / --";
            rightCard.children.item(2).children.namedItem("msg").innerText = localJobs[localUnits[unitCardTarget].job].msg || "-- / --";
            document.querySelector("#unit_card_right > div").style.display = "";
        }
        catch {
            document.querySelector("#unit_card_job").innerText = "Fehler beim Laden der Einsatzdaten";
        }
    }
    else {
        //hide button to send multiple msgs
        document.querySelector("#unit_card_sendmsg span:nth-child(3)").style.display = "none";

        document.querySelector("#unit_card_job").innerText = "Kein Einsatz zugewiesen";
        document.querySelector("#unit_card_joblink").style.display = "none";
        document.querySelector("#unit_card_right > div").style.display = "none";
    }

    //set card to visible
    document.querySelector("#unit_card").style.display = "flex";
}

function closeUnitCard() {
    unitCard = null;
    document.querySelector("#unit_card").style.display = "none";
}

function updateJobUnits() {
    let elements = document.querySelectorAll("#active_jobs .jobListing span[name=units]");

    for (let i = 0, iLength = elements.length; i < iLength; i++) {
        let tmpId = elements[i].parentNode.parentNode.parentNode.dataset.id;
        let tmpEl = elements[i];

        //console.log(tmpId, tmpEl)

        let assignedUnits = new Array();

        for (let j = 0, jLength = Object.keys(localUnits).length; j < jLength; j++) {
            if (localUnits[Object.keys(localUnits)[j]].job == tmpId)
                assignedUnits.push(Object.keys(localUnits)[j]);
        }

        let unitsTitle = assignedUnits.join("\n");
        let unitsText;

        if (assignedUnits.length > 2) {
            unitsText = assignedUnits.slice(0, 2);
            unitsText.push("...");
            unitsText = unitsText.join(", ");
        }
        else if (assignedUnits.length == 0) {
            unitsText = "-- / --";
        }
        else {
            unitsText = assignedUnits.join(", ");
        }

        tmpEl.innerText = unitsText;
        tmpEl.setAttribute("title", unitsTitle);
    }
}

function msgInput(el) {
    if (el.value.length > 38)
        el.value = el.value.slice(0, 38);
}

function sendToUnit(sendToJob) {
    let msg = document.querySelector("#unit_card_sendmsg input").value;
    document.querySelector("#unit_card_sendmsg input").value = "";

    if (!msg)
        return

    if (sendToJob) {//iterate through every uni, send msg when it has the same job
        let jobId = localUnits[unitCard].job;
        for (let i = 0, iLength = Object.keys(localUnits).length; i < iLength; i++) {
            if (localUnits[Object.keys(localUnits)[i]].job == jobId)
                sendSocket({ "lst_msg": [Object.keys(localUnits)[i], msg] });
        }
    }
    else
        sendSocket({ "lst_msg": [unitCard, msg] });
}

function openJobCreation() {
    window.electronAPI.sendMsg(["createjob", [auth.faction, null, null]]);
}

function openJobEdit(jobId) {
    let tmpJob = localJobs[jobId];
    tmpJob.id = jobId;

    window.electronAPI.sendMsg(["createjob", [auth.faction, tmpJob, null]]);
}

function deleteJob(jobId) {
    fetch(`https://dispatch.kreisi.net/deletejob?id=${jobId}&user_faction=${auth.faction}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
}

function deleteJobs(jobElList) {
    for(let i=0,iLength=jobElList.length; i<iLength; i++) {
        deleteJob(jobElList[i].dataset.id);
        setTimeout(()=>{}, 200);
    }
}

function callUnit(unit, urgent) {
    sendSocket({ "lst_call": [unit, urgent] });
}





/* Communication */

function connectionUpdate(connection) {
    console.log("connection:", connection)

    if (connection)
        document.querySelector("#connection").innerText = "connected"
    else
        document.querySelector("#connection").innerText = "not connected"
}

function unitsUpdate(message) {
    //console.log(message)

    for (let i = 0, iLength = Object.keys(message).length; i < iLength; i++) {
        //console.log(message[Object.keys(message)[i]])
        //console.log(Object.keys(message)[i])

        if (Object.keys(message[Object.keys(message)[i]]).includes("status")) {
            document.querySelector(`.unitTile[data-unit="${Object.keys(message)[i]}"] .unitStatus .fieldData`).innerText = message[Object.keys(message)[i]].status;

            //update local storage
            localUnits[Object.keys(message)[i]].status = message[Object.keys(message)[i]].status;

            //remove old status class
            for (let j = 0; j <= 9; j++) {
                document.querySelector(`.unitTile[data-unit="${Object.keys(message)[i]}"]`).classList.remove(`status${j}`);
            }

            //set new status class
            document.querySelector(`.unitTile[data-unit="${Object.keys(message)[i]}"]`).classList.add(`status${message[Object.keys(message)[i]].status}`);

            let newStatus = message[Object.keys(message)[i]].status;
            if (newStatus == 5 || newStatus == 9)
                statusMsg(Object.keys(message)[i], newStatus);
        }

        if (Object.keys(message[Object.keys(message)[i]]).includes("users")) {
            document.querySelector(`.unitTile[data-unit="${Object.keys(message)[i]}"] .unitUsers .fieldData`).innerText = message[Object.keys(message)[i]].users.length;

            //update local storage
            localUnits[Object.keys(message)[i]].users = message[Object.keys(message)[i]].users;
        }

        if (Object.keys(message[Object.keys(message)[i]]).includes("job")) {
            //update local storage
            localUnits[Object.keys(message)[i]].job = (message[Object.keys(message)[i]].job == "false" ? false : message[Object.keys(message)[i]].job);

            updateJobUnits();
        }

        //update open unit card if needed
        if (unitCard == Object.keys(message)[i]) {
            openUnitCard(Object.keys(message)[i]);
        }
    }
}

function jobsUpdate(jobs) {
    //play sound if new job is added
    if(localJobs) {//only if LST didn't just start
        if(Object.keys(jobs).filter(el => !Object.keys(localJobs).includes(el)).length > 0)
            playSound("new_call");
    }

    localJobs = jobs;
    let activeJobList = document.querySelector("#active_jobs > .jobList");
    let newJobList = document.querySelector("#new_jobs > .jobList");
    let factionClasses = {
        "rd": "rdJob",
        "pol": "polJob"
    };

    activeJobList.innerHTML = "";
    newJobList.innerHTML = "";

    for (let i = 0, iLength = Object.keys(jobs).length; i < iLength; i++) {
        let tmpJob = jobs[Object.keys(jobs)[i]];
        //console.log(tmpJob)

        let correctTable;
        let jobInfo;
        if (tmpJob.active) {
            correctTable = activeJobList;

            jobInfo = `
            <span class="jobInfo">
                <span>
                    <span class="material-symbols-outlined">minor_crash</span>
                    <span name="units"></span>
                </span>
                <span>
                    <span class="material-symbols-outlined">location_on</span>
                    <span>${makeSafe(tmpJob.location) || "-- / --"}</span>
                </span>
            </span>
            `;
        }
        else {
            correctTable = newJobList;
            jobInfo = `
            <span class="jobInfo">
                <span>
                    <span class="material-symbols-outlined">call</span>
                    <span>${makeSafe(tmpJob.caller) || "-- / --"}</span>
                </span>
                <span>
                    <span class="material-symbols-outlined">location_on</span>
                    <span>${makeSafe(tmpJob.location) || "-- / --"}</span>
                </span>
            </span>
            `;
        }

        correctTable.innerHTML += `
        <span class="jobListing ${factionClasses[tmpJob.creator]}" data-id="${Object.keys(jobs)[i]}">
            <span class="jobTitle">${makeSafe(tmpJob.title)}</span>
            <span class="jobTimestamp" name="timestamp"></span>
            ${jobInfo}
            <span class="editJobBtn material-symbols-outlined" onclick="openJobEdit(this.parentNode.dataset.id)">edit</span>
            <span class="deleteJobBtn material-symbols-outlined" onclick="deleteJob(this.parentNode.dataset.id)">delete</span>
        </span>`;
    }
    updateJobUnits();
}

function openMap() {
    let mapContainer = document.getElementById("map_container");
    mapContainer.classList.add("shown");
    populateMap();
}

function closeMap() {
    let mapContainer = document.getElementById("map_container");
    mapContainer.classList.remove("shown");

    depopulateMap();
    setPanMap(false);
    setMapTargetMode(false);
}

function populateMap() {
    console.log(localJobs)

    Object.values(localJobs).forEach((job, i)=>{
        if(job.coords) {
            let coords = JSON.parse(job.coords);
            drawJobOnMap(Object.keys(localJobs)[i], coords.x, coords.y);
        }
    });
}

function depopulateMap() {
    document.querySelectorAll(".mapJobMarker").forEach((el)=>{
        el.remove();
    });
}

function updateMapTransforms() {
    document.getElementById("map_img").style.setProperty("--offsetX", `${mapInfo.x}%`);
    document.getElementById("map_img").style.setProperty("--offsetY", `${mapInfo.y}%`);
    document.getElementById("map_img").style.setProperty("--zoom", `${mapInfo.zoom}px`);
}

function setPanMap(panning, e) {
    if(mapInfo.targetMode)
        return;

    mapInfo.panning = panning;
    let mapImg = document.querySelector("#map_img img");

    if(panning) {
        mapInfo.dimensions = document.getElementById("map_img").getBoundingClientRect();
        mapImg.classList.add("panning");
    }
    else {
        mapInfo.dimensions = null;
        mapImg.classList.remove("panning");
    }
}

function panMap(e) {
    if(mapInfo.panning) {
        mapInfo.x += e.movementX / mapInfo.dimensions.width * 100
        mapInfo.y += e.movementY / mapInfo.dimensions.height * 100
        updateMapTransforms();
    }
}

function mapScroll(e) {
    if(mapInfo.targetMode)
        return;
    mapInfo.zoom = Math.max(800, mapInfo.zoom - e.deltaY*2);
    updateMapTransforms();
}

function setMapOffset(x, y) {
    mapInfo.x = x;
    mapInfo.y = y;
    updateMapTransforms();
}

function resetMap() {
    mapInfo.zoom = 1000;
    mapInfo.x = 0;
    mapInfo.y = 0;
    updateMapTransforms();
}

function setMapTargetMode(targetMode) {
    let mapImg = document.querySelector("#map_img img");
    let targetModePopup = document.getElementById("target_mode_popup");
    mapInfo.targetMode = targetMode;

    if(targetMode) {
        mapImg.classList.add("targetMode");
        targetModePopup.classList.add("shown");
    }
    else {
        mapImg.classList.remove("targetMode");
        targetModePopup.classList.remove("shown");
    }
}

function createJobOnMap(e) {
    if(!mapInfo.targetMode || e.target.nodeName != "IMG")
        return;

    let x = (e.offsetX / e.target.clientWidth * 100 - 45.97);
    let y = -(e.offsetY / e.target.clientHeight * 100 - 62.2);

    x = x * (667 / 7.4);
    y = y * (1000 / 7.4);

    window.electronAPI.sendMsg(["createjob", [auth.faction, null, JSON.stringify({x:x,y:y})]]);

    closeMap();
}

function drawJobOnMap(jobId, x, y) {
    let mapImg = document.getElementById("map_img");

    let el = document.createElement("span");
    el.classList.add("mapJobMarker");
    el.classList.add("material-symbols-outlined");
    el.dataset.jobId = jobId;
    el.style.setProperty("--markerOffsetX", `${x / 667 * 7.4}%`);
    el.style.setProperty("--markerOffsetY", `${-y / 1000 * 7.4}%`);
    el.setAttribute("onclick", `openJobEdit(this.dataset.jobId)`);
    el.innerText = "my_location";
    if(localJobs[jobId].creator == "pol")
        el.classList.add("polMapMarker");
    else
        el.classList.add("rdMapMarker");

    let labelEl = document.createElement("span");
    labelEl.classList.add("mapJobMarkerLabel");
    labelEl.innerHTML = `
    <h1>${localJobs[jobId].title}</h1>
    ${localJobs[jobId].caller ? "<p>"+localJobs[jobId].caller+"</p>" : ""}
    ${localJobs[jobId].msg ? "<p>"+localJobs[jobId].msg+"</p>" : ""}
    `;

    el.appendChild(labelEl);
    mapImg.appendChild(el);
}

function statusMsg(unit, status) {
    let audioEl = document.querySelector("#audio");
    //console.log(unit,status)

    //debug TODO: implement LST settings
    audioEl.volume = 0.2
    playSound(`status${status}`);
    openPopup(`status${status}`, unit);
}

function playSound(soundName) {
    let audioEl = document.querySelector("#audio");
    audioEl.volume = 0.6;

    audioEl.src = `../src/soundset_0/${soundName}.mp3`;
    audioEl.play();
}