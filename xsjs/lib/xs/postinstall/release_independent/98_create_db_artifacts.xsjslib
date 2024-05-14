/*
This is a mandatory step in every version as it creates DB Artifacts and updates the database with latest version.
 */

var pers = await $.import('xs.db', 'persistency');

var runOnFreshInstallation = true;

async function check(oConnection) {
    return true;
}

//This method will update the state of the database with the latest version deployed
async function run(oConnection) {
    var oPersistency = await new pers.Persistency(oConnection);
    var sVersionId = oPersistency.ApplicationManagement.getApplicationVersion(MTA_METADATA);

    // check if dynamic DB artefacts for custom fields have been initialized for this DU version
    var bPlcState = oPersistency.ApplicationManagement.isPlcInitialized(sVersionId);
    if (!bPlcState) {
        // generate all DB artefacts and analytic views (*_CUST views)
        oPersistency.DbArtefactController.generateAllFiles();

        //write back successful system initialization
        oPersistency.ApplicationManagement.writePlcInitializationState(sVersionId);
    }

    return true;
}

async function clean(oConnection) {
    return true;
}
export default {pers,runOnFreshInstallation,check,run,clean};
