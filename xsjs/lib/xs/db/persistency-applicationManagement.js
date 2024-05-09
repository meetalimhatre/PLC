const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

var Tables = await Object.freeze({ initialization_state: 'sap.plc.db::basis.t_initialization_state' });

function ApplicationManagement($, dbConnection) {

    /**
     * Get the installed version of the application according to configuration in file mta.yaml.
     */
    this.getApplicationVersion = async function (mtaMetadata) {
        if (await helpers.isNullOrUndefined(mtaMetadata)) {
            var developerInfo = `MTA_METADATA is null.`;
            $.trace.error(developerInfo);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        } else if (await helpers.isNullOrUndefined(mtaMetadata.version)) {
            var developerInfo = `Version of application not defined in MTA_METADATA.`;
            $.trace.error(developerInfo);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, developerInfo);
        }
        return mtaMetadata.version;
    };

    /**
     * Check if dynamic DB artefacts (SQLScript, table types) have been initialized for the given MTA version.
     */
    this.isPlcInitialized = async function (sVersion) {
        var queryResult = dbConnection.executeQuery('select plc_version, generation_time from "' + Tables.initialization_state + '"');
        return queryResult.length !== 0 && !helpers.isNullOrUndefined(queryResult[0].PLC_VERSION) && queryResult[0].PLC_VERSION === sVersion;
    };

    /**
     * Write the given version to the PLC initialization state table.
     */
    this.writePlcInitializationState = function (sVersion) {
        // delete existing entries
        dbConnection.executeUpdate('delete from "' + Tables.initialization_state + '"');

        // add new row
        dbConnection.executeUpdate('insert into "' + Tables.initialization_state + '" (plc_version, generation_time) values (?, ?)', sVersion, new Date());
    };
}
ApplicationManagement.prototype = await Object.create(ApplicationManagement.prototype);
ApplicationManagement.prototype.constructor = ApplicationManagement;

module.exports.ApplicationManagement = ApplicationManagement;
export default {helpers,MessageLibrary,PlcException,Code,Tables,ApplicationManagement};