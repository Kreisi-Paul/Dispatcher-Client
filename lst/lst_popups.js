let popupDiv = document.querySelector("#popups");

function openPopup(popupType, popupContent) {
    console.log(popupType, popupContent)

    //initiate popup variables
    let popupDuration;
    let newPopup = document.createElement("div");
    newPopup.classList.add("popup");

    if(popupType == "status5") {
        popupDuration = 8000;
        newPopup.innerHTML = `
        <span class="popupContent">Einheit <b onclick="">${makeSafe(popupContent)}</b> mit Sprechwunsch</span>
        <span class="popupTimestamp">${new Date(Date.now()).toLocaleTimeString("de")} Uhr</span>
        `;
        newPopup.classList.add("status5");
    }
    else if(popupType == "status9") {
        popupDuration = 12000;
        newPopup.innerHTML = `
        <span class="popupContent">Einheit <b onclick="">${makeSafe(popupContent)}</b> Status 9!</span>
        <span class="popupTimestamp">${new Date(Date.now()).toLocaleTimeString("de")} Uhr</span>
        `;
        newPopup.classList.add("status9");
    }

    //show popup, remove after set duration
    popupDiv.appendChild(newPopup);
    setTimeout(()=>{
        newPopup.remove();
    }, popupDuration);
}