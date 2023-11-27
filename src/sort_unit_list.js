/**
 * sorts unit list into its areas
 * @param {Object} units 
 */
function sortUnitList(units) {
    let unitKeys = Object.keys(units);
    let sortedUnits = new Object();

    for(let i=0,iLength=unitKeys.length; i<iLength; i++) {

        if(!Object.keys(sortedUnits).includes(units[unitKeys[i]].area)) {
            sortedUnits[units[unitKeys[i]].area] = {};
        }

        sortedUnits[units[unitKeys[i]].area][unitKeys[i]] =
        {
            "job" : units[unitKeys[i]].job,
            "status" : units[unitKeys[i]].status,
            "users" : units[unitKeys[i]].users
        }
    }

    sortedUnits.sort();
    for(let i=0,iLength=Object.keys(sortedUnits).length; i < iLength; i++) {
        sortedUnits[Object.keys(sortedUnits)[i]].sort();
    }

    return sortedUnits;
}