let auth = new Object();
let jobId = null;
let jobActive;
let assignedUnits = { "old": [], "new": [] };
let urgencyCollapsed = true;
let popupShown = false;

window.electronAPI.mainProc((event, arg) => {
    console.log(event, arg)
    if (Object.keys(arg).includes("auth")) {
        auth.user_ident = arg.auth.user_ident;
        auth.user_key = arg.auth.user_key;
    }
    if (Object.keys(arg).includes("jobdata")) {
        //autofill data from LST window
        console.log(arg.jobdata)

        //set auth faction
        auth.faction = arg.jobdata[0];

        //apply info if applicable
        if (arg.jobdata[1]) {
            jobId = arg.jobdata[1].id;
            jobActive = arg.jobdata[1].active;

            document.querySelector("#job_title").value = arg.jobdata[1].title;
            document.querySelector("#job_caller").value = arg.jobdata[1].caller;
            document.querySelector("#job_msg").value = arg.jobdata[1].msg;
            document.querySelector("#job_location").value = arg.jobdata[1].location;
            document.querySelector("#job_coords").value = arg.jobdata[1].coords;

            document.querySelector("#current_urgency").innerText = arg.jobdata[1].urgency;

            document.querySelector("#job_id_0").innerText = arg.jobdata[1].id;
            document.querySelector("#job_id_1").innerText = new Date(parseInt(arg.jobdata[1].id)).toLocaleString("de");

            if (jobActive) {
                document.querySelector("#activate_job").innerText = "save";
                document.querySelector("#activate_job").setAttribute("title", "Änderungen speichern");
                document.querySelector("#activate_job").style.transform = "unset";

                document.querySelector("#save_job").style.display = "none";
            }
        }

        if(arg.jobdata[2]) {
            document.querySelector("#job_coords").value = arg.jobdata[2];
        }
    }
})

onload = (event) => {
    console.log(event)
    window.electronAPI.getAuth();
    window.electronAPI.sendMsg("getjobinfo");

    setTimeout(() => {
        drawUnitList();
    }, 2000);
}

function saveJob(activate) {
    if (jobId)
        editJob(activate)
    else {
        createJob(activate);
    }
}

async function createJob(activate) {
    document.querySelector("#loading").style.display = "flex";

    let tmpJob = {
        "title": document.querySelector("#job_title").value,
        "caller": document.querySelector("#job_caller").value,
        "location": document.querySelector("#job_location").value,
        "coords": document.querySelector("#job_coords").value,
        "msg": document.querySelector("#job_msg").value,
        "urgency": document.querySelector("#current_urgency").innerText
    };

    //create job, get id
    fetch(`https://dispatch.kreisi.net/createjob?user_faction=${encodeURIComponent(auth.faction)}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&job_title=${encodeURIComponent(tmpJob.title)}&job_caller=${encodeURIComponent(tmpJob.caller)}&job_location=${encodeURIComponent(tmpJob.location)}&job_coords=${encodeURIComponent(tmpJob.coords)}&job_msg=${encodeURIComponent(tmpJob.msg)}&job_urgency=${encodeURIComponent(tmpJob.urgency)}&job_active=${activate}`).then(async (response) => {
        if (response.status != 200) {
            showPopup(`Anfrage fehlgeschlagen<br>(${response.status})`);
            return;
        }

        let id = await response.text();
        console.log(id)

        if (activate) {
            //assign units
            for (let i = 0, iLength = assignedUnits.new.length; i < iLength; i++) {
                await fetch(`https://dispatch.kreisi.net/assignunit?user_faction=${encodeURIComponent(auth.faction)}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&id=${id}&unit=${encodeURIComponent(assignedUnits.new[i])}`);
            }
        }

        window.close();
    });
}

async function editJob(active) {
    document.querySelector("#loading").style.display = "flex";

    let tmpJob = {
        "title": document.querySelector("#job_title").value,
        "caller": document.querySelector("#job_caller").value,
        "location": document.querySelector("#job_location").value,
        "coords": document.querySelector("#job_coords").value,
        "msg": document.querySelector("#job_msg").value,
        "urgency": document.querySelector("#current_urgency").innerText
    };

    let response = await fetch(`https://dispatch.kreisi.net/editjob?user_faction=${encodeURIComponent(auth.faction)}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&job_title=${encodeURIComponent(tmpJob.title)}&job_caller=${encodeURIComponent(tmpJob.caller)}&job_location=${encodeURIComponent(tmpJob.location)}&job_coords=${encodeURIComponent(tmpJob.coords)}&job_msg=${encodeURIComponent(tmpJob.msg)}&job_urgency=${encodeURIComponent(tmpJob.urgency)}&job_id=${jobId}&job_active=${active}`);
    console.log(response)

    if (response.status == 200) {
        let removedUnits = new Array();
        let addedUnits = new Array();

        //get removed units
        for (let i = 0, iLength = assignedUnits.old.length; i < iLength; i++) {
            if (!assignedUnits.new.includes(assignedUnits.old[i]))
                await removedUnits.push(assignedUnits.old[i]);
        }

        //get added units
        for (let i = 0, iLength = assignedUnits.new.length; i < iLength; i++) {
            if (!assignedUnits.old.includes(assignedUnits.new[i]))
                await addedUnits.push(assignedUnits.new[i]);
        }

        console.log(removedUnits, addedUnits)

        setTimeout(async () => {
            //remove assignments
            for (let i = 0, iLength = removedUnits.length; i < iLength; i++) {
                await fetch(`https://dispatch.kreisi.net/assignunit?user_faction=${encodeURIComponent(auth.faction)}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&id=false&unit=${encodeURIComponent(removedUnits[i])}`);
            }

            //add assignments
            for (let i = 0, iLength = addedUnits.length; i < iLength; i++) {
                await fetch(`https://dispatch.kreisi.net/assignunit?user_faction=${encodeURIComponent(auth.faction)}&user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}&id=${jobId}&unit=${encodeURIComponent(addedUnits[i])}`);
            }

            window.close();
        }, 2000);
    }
    else {
        console.warn("fetch failed");
        showPopup(`Anfrage fehlgeschlagen<br>(${response.status})`);
    }
}


function limitInput(el, limit) {
    if (el.value.length > limit) {
        el.value = el.value.slice(0, limit);
    }
}

function addUnitBtn(el) {
    let tmpUnit = el.parentNode.dataset.unit;

    if (assignedUnits.new.includes(tmpUnit)) {
        assignedUnits.new.splice(assignedUnits.new.indexOf(tmpUnit), 1);
        el.innerText = "add";
    }
    else {
        assignedUnits.new.push(tmpUnit);
        el.innerText = "remove";
    }
}

function collapseUrgencyBtn() {
    if (urgencyCollapsed) {
        urgencyCollapsed = false;
        document.querySelector("#collapse_urgency").innerText = "expand_less";
        document.querySelector("#urgency_selection div").style.display = "flex";
    }
    else {
        urgencyCollapsed = true;
        document.querySelector("#collapse_urgency").innerText = "expand_more";
        document.querySelector("#urgency_selection div").style.display = "none";
    }
}

function setUrgency(newUrgency) {
    collapseUrgencyBtn();
    document.querySelector("#current_urgency").innerText = newUrgency;
}

async function drawUnitList() {
    let response = await fetch(`https://dispatch.kreisi.net/getvehicles/${encodeURIComponent(auth.faction)}?user_ident=${encodeURIComponent(auth.user_ident)}&user_key=${encodeURIComponent(auth.user_key)}`);
    let units = await response.json()
    let unitList = "";

    for (let i = 0, iLength = Object.keys(units).length; i < iLength; i++) {
        console.log(Object.keys(units)[i])
        console.log(units[Object.keys(units)[i]])

        if (units[Object.keys(units)[i]].job == jobId) {
            assignedUnits.old.push(Object.keys(units)[i]);
            assignedUnits.new.push(Object.keys(units)[i]);
        }

        unitList += `
        <span class="unitField" data-unit="${makeSafe(Object.keys(units)[i])}">
            <span class="unitStatus status${units[Object.keys(units)[i]].status}">${units[Object.keys(units)[i]].status}</span>
            <div>
                <span class="unitTitle">${makeSafe(Object.keys(units)[i])}</span>
                ${units[Object.keys(units)[i]].job != false && units[Object.keys(units)[i]].job != jobId ? `<span class="unitWarning material-symbols-outlined" title="Dieser Einheit wurde schon ein Einsatz zugewiesen">assignment_late</span>` : ""}
                ${units[Object.keys(units)[i]].users.length == 0 ? `<span class="unitWarning material-symbols-outlined" title="Diese Einheit ist nicht besetzt">person_alert</span>` : ""}
            </div>
            <span class="addUnitBtn material-symbols-outlined" onclick="addUnitBtn(this)">${units[Object.keys(units)[i]].job == jobId ? "remove" : "add"}</span>
        </span>
        `;
    }

    document.querySelector("#unit_list").innerHTML = unitList;
}

function showPopup(content) {
    document.querySelector("#popup").style.display = "flex";
    document.querySelector("#popup span").innerHTML = content;
}
