
const jobInfo = document.querySelector("#job_info");
let openWindow;
let syncCooldown = false;
let pagerSettings = new Object();
let soundset;
let activeJobId = false;

/* --- Pager Init --- */

function initPager() {
    closeSettings();
    window.electronAPI.pagerSettings(["get","pager_s_touchscreen"]);
    window.electronAPI.getSettings();
}
function loadPagerSettings(newSettings) {
    console.log(newSettings)

    if(newSettings) {//apply saved options
        setOpacity(newSettings.opacity);
        setContrast(newSettings.contrast);
        setVolume(newSettings.volume);
    }
    else {//apply standard options
        setOpacity(6);
        setContrast(3);
        setVolume(1);
    }
}
function loadSettings(newSettings) {
    soundset = newSettings.soundset;
}

/* --- Settings --- */

function setOpacityInput(event) {
    let opacityTarget = event.target.dataset.opacity;

    //return if no valid option is clicked
    if(!opacityTarget)
        return;

    //set opacity
    setOpacity(opacityTarget);
}
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
    console.log("new opacity",newOpacity)

    //return if old value is selected
    if(pagerSettings.opacity == newOpacity)
        return;

    //remove all selection indicators
    document.querySelectorAll("#opacity_selector .ch_selection_active").forEach((el)=>{el.classList.remove("ch_selection_active")});

    //add selection indicator
    document.querySelector(`#opacity_selector span[data-opacity="${newOpacity}"]`).classList.add("ch_selection_active");

    //change opacity via main process
    window.electronAPI.pagerSettings(["opacity",opacitySettings[newOpacity]]);

    //only save settings if settings were already initialized
    if(pagerSettings.opacity) {
        pagerSettings.opacity = newOpacity;
        window.electronAPI.pagerSettings(["set",["pager_s_touchscreen",pagerSettings]]);
    }
    else
        pagerSettings.opacity = newOpacity;
}

function setContrastInput(event) {
    let contrastTarget = event.target.dataset.contrast;

    //return if no valid option is clicked
    if(!contrastTarget)
        return;

    //set contrast
    setContrast(contrastTarget);
}
function setContrast(newContrast) {
    let contrastSettings = [
        ["#98b3a5","#404040"],
        ["#b3ccbf","#333333"],
        ["#c0d8cc","#262626"],
        ["#D9E9DF","#1F1F1F"],
        ["#dfece4","#0d0d0d"]
    ];
    console.log("new contrast",newContrast)

    //return if old value is selected
    if(pagerSettings.contrast == newContrast)
        return;


    //remove all selection indicators
    document.querySelectorAll("#contrast_selector .ch_selection_active").forEach((el)=>{el.classList.remove("ch_selection_active")});

    //add selection indicator
    document.querySelector(`#contrast_selector span[data-contrast="${newContrast}"]`).classList.add("ch_selection_active");

    //change contrast via css variables
    document.documentElement.style.cssText = `
    --screen-color: ${contrastSettings[newContrast][0]};
    --screen-text: ${contrastSettings[newContrast][1]};
    `;

    //only save settings if settings were already initialized
    if(pagerSettings.contrast) {
        pagerSettings.contrast = newContrast;
        window.electronAPI.pagerSettings(["set",["pager_s_touchscreen",pagerSettings]]);
    }
    else
        pagerSettings.contrast = newContrast;
}

function setVolumeInput(event) {
    let volumeTarget = event.target.dataset.volume;

    //return if no valid option is clicked
    if(!volumeTarget)
        return;

    //set volume
    setVolume(volumeTarget);
}
function setVolume(newVolume) {
    let volumeSettings = [
        [0,"notifications_off"],
        [0.05,"notifications"],
        [0.1,"notifications"],
        [0.15,"notifications"],
        [0.2,"notifications_active"],
        [0.4,"notifications_active"],
        [0.6,"notifications_active"]
    ];
    console.log("new volume",newVolume)

    //return if old value is selected
    if(pagerSettings.volume == newVolume)
        return;


    //remove all selection indicators
    document.querySelectorAll("#volume_selector .ch_selection_active").forEach((el)=>{el.classList.remove("ch_selection_active")});

    //add selection indicator
    document.querySelector(`#volume_selector span[data-volume="${newVolume}"]`).classList.add("ch_selection_active");

    //change volume, volume indicators
    document.querySelector("#audio").volume = volumeSettings[newVolume][0];
    document.querySelector("#sound").innerText = volumeSettings[newVolume][1];
    

    //only save settings if settings were already initialized
    if(pagerSettings.volume) {
        pagerSettings.volume = newVolume;
        window.electronAPI.pagerSettings(["set",["pager_s_touchscreen",pagerSettings]]);
        playSound("beep");//preview sound
    }
    else
        pagerSettings.volume = newVolume;
}

/* --- Misc & UI --- */

function closeSettings() {
    let windows = document.querySelectorAll(".ch_div");

    for(let i=0, iLength=windows.length; i<iLength; i++) {
        windows[i].style.display = "none";
    }
    openWindow = null;
}

function openSettings(setting) {
    document.querySelector(`#ch_${setting}`).style.display = "flex";
    openWindow = setting;
}

function btnOff() {
    window.close();
}

function btnPress(btn) {
    if(openWindow == btn) // öffnet fenster oder schließt Fenster wenn schon offen
        closeSettings();
    else {
        closeSettings();
        openSettings(btn);
    }
}

function requestSync() {
    if(!syncCooldown) {
        syncCooldown = true;
        document.querySelector("#sync").classList.add("textBlink");
        syncPager();

        setTimeout(()=>{
            document.querySelector("#sync").classList.remove("textBlink");
            syncCooldown = false;
        }, 10000);
    }
}

/* --- Communication --- */

function connectionUpdate(new_connected) {
    if(new_connected) {
        document.querySelector("#unit_display").innerText = userAuth.unit;
        document.querySelector("#connection").innerText = "signal_cellular_3_bar";
        document.querySelector("#connection").classList.remove("textBlink");
    }
    else {
        document.querySelector("#connection").innerText = "signal_cellular_nodata";
        document.querySelector("#connection").classList.add("textBlink");
    }
}

function statusUpdate(new_status) {
    document.querySelector("#status_nmbr").innerText = new_status;
}

function jobUpdate(new_job_id) {
    let jobUpdated; //for preventing new_call sound
    //console.warn(new_job_id)

    //clear previous job
    document.querySelector("span[data-job=title]").innerText = "";
    document.querySelector("span[data-job=location]").innerText = "";
    document.querySelector("span[data-job=caller]").innerText = "";
    document.querySelector("span[data-job=comment]").innerText = "";

    //play sound
    if(new_job_id == false) {
        playSound("no_job");
    }
    else if(new_job_id == activeJobId) {
        playSound("update_job");
        jobUpdated = true;
    }

    //update active job id
    activeJobId = new_job_id;

    if(new_job_id == false)
        return

    //display wait message, remove error message if needed
    document.querySelector("#job_download_fail").style.display = "none";
    document.querySelector("#job_download").style.display = "flex";


    fetch(`https://dispatch.kreisi.net/getjobinfo?id=${new_job_id}&user_faction=${userAuth.faction}&user_ident=${encodeURIComponent(userAuth.user_ident)}&user_key=${encodeURIComponent(userAuth.user_key)}`).then(async(response)=>{
        console.log(response)
        if(response.status == 200) {
            document.querySelector("#job_download").style.display = "none";
        }
        else {//display error message when job info cannot be obtained
            document.querySelector("#job_download").style.display = "none";
            document.querySelector("#job_download_fail").style.display = "flex";
            return;
        }
        let new_job = await response.json();
        console.log(new_job)

        //play appropriate sound
        if(!jobUpdated) {
            switch(new_job.urgency) {
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
        }

        //set new job info if available
            document.querySelector("span[data-job=title]").innerText = new_job.title;
            document.querySelector("span[data-job=location]").innerHTML = `<span class="material-symbols-outlined">location_on</span> ${makeSafe(new_job.location) || "-/-"}`;
            document.querySelector("span[data-job=caller]").innerHTML = `<span class="material-symbols-outlined">call</span> ${makeSafe(new_job.caller) || "-/-"}`;
            document.querySelector("span[data-job=comment]").innerHTML = `<span class="material-symbols-outlined">notes</span> ${makeSafe(new_job.msg) || "-/-"}`;
    });
}

function lstCall(urgent) {

    //cancel call if another is already active
    if(document.querySelector("#lst_call").style.display == "flex")
        return;

    let warningLength;

    //show warning popup
    if(urgent) {
        document.querySelector("#lst_call").classList.add("urgentLstCall");
        document.querySelector("#lst_call_img").innerText = "e911_avatar";
        document.querySelector("#lst_call_msg").innerText = "LST-RUF WICHTIG!";
        warningLength = 11000;
        playSound("lst_call_urgent");
    }
    else {
        document.querySelector("#lst_call_img").classList.add("textBlink");
        document.querySelector("#lst_call_img").innerText = "call";
        document.querySelector("#lst_call_msg").innerText = "LST-RUF";
        warningLength = 5000;
        playSound("lst_call");
    }
    document.querySelector("#lst_call").style.display = "flex";

    //remove warning after set time
    setTimeout(()=>{
        document.querySelector("#lst_call").style.display = "none";
        document.querySelector("#lst_call").classList.remove("urgentLstCall");
        document.querySelector("#lst_call_img").classList.remove("textBlink");
    }, warningLength);
}

function lstMsg(msg) {
    let msgEl = document.querySelector("#lst_msg");

    if(msgEl.style.display == "flex")
        return;
    
    playSound("lst_msg");

    //reset content in case this throws
    msgEl.children.namedItem("lst_msg_text").innerText = "";

    msgEl.children.namedItem("lst_msg_text").innerText = msg;
    msgEl.style.display = "flex";

    setTimeout(()=>{
        msgEl.style.display = "none";
    }, 8000);
}

/* --- Sound --- */

function playSound(soundName) {
    let audioEl = document.querySelector("#audio");

    audioEl.src = `../src/${soundset}/${soundName}.mp3`;
    audioEl.play();
}