const _ = $.require('lodash');
const Helper = $.require('./persistency-helper').Helper;
const AddinStates = $.require('../util/constants').AddinStates;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({
    version: 'sap.plc.db::basis.t_addin_version',
    configuration_header: 'sap.plc.db::basis.t_addin_configuration_header',
    configuration_items: 'sap.plc.db::basis.t_addin_configuration_items'
});

function Addin(dbConnection, hQuery) {

    this.helper = new Helper($, hQuery, dbConnection);

    /**
	 * Gets single addin including config header
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {object} output - An addin version object
	 */
    this.getAddin = async function (sGuid, aVersions) {

        var sAddinStmt = [
            'select a.addin_guid addin_guid, a.addin_major_version addin_major_version, a.addin_minor_version addin_minor_version, a.addin_revision_number addin_revision_number,',
            'a.addin_build_number addin_build_number, a.name name,',
            'a.full_qualified_name full_qualified_name, a.description description, a.publisher publisher,',
            'a.status status,',
            'a.certificate_issuer certificate_issuer, a.certificate_subject certificate_subject, a.certificate_valid_from certificate_valid_from, a.certificate_valid_to certificate_valid_to,',
            'a.created_on created_on, a.created_by created_by, a.last_modified_on last_modified_on, a.last_modified_by last_modified_by,',
            'b.created_on header_created_on, b.created_by header_created_by, b.last_modified_on header_last_modified_on, b.last_modified_by header_LAST_MODIFIED_BY',
            'from "' + Tables.version + '" a',
            'left outer join "' + Tables.configuration_header + '" b',
            'on a.addin_guid = b.addin_guid and a.addin_major_version = b.addin_major_version and a.addin_minor_version = b.addin_minor_version and a.addin_revision_number = b.addin_revision_number',
            'and a.addin_build_number = b.addin_build_number',
            'where a.addin_guid = ? and a.addin_major_version = ? and a.addin_minor_version = ? and a.addin_revision_number = ? and a.addin_build_number = ?;'
        ].join(' ');
        var oResult = dbConnection.executeQuery(sAddinStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        if (oResult.length > 1) {
            const sLogMessage = `Corrupted db entries for addin with guid '${ sGuid }' and version '${ aVersions.join('.') }'.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        if (oResult.length === 0) {
            const sLogMessage = `Addin with guid '${ sGuid }' and version '${ aVersions.join('.') }' does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(MessageLibrary.Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        return oResult[0];
    };

    /**
	 * Gets addins including config header, dependent on their status (e.g. all or activated).
	 * @param {String}
	 *            sStatus - status of addins to be extracted
	 * @returns {object} output - An array of addin versions
	 */
    this.getAddinsByStatus = function (sStatus) {

        var sWhere = '';
        if (sStatus === AddinStates.Activated) {
            sWhere = " where a.status = '" + AddinStates.Activated + "'";
        }

        var sAddinsStmt = [
            'select a.addin_guid addin_guid, a.addin_major_version addin_major_version, a.addin_minor_version addin_minor_version, a.addin_revision_number addin_revision_number,',
            'a.addin_build_number addin_build_number, a.name name,',
            'a.full_qualified_name full_qualified_name, a.description description, a.publisher publisher,',
            'a.status status,',
            'a.certificate_issuer certificate_issuer, a.certificate_subject certificate_subject, a.certificate_valid_from certificate_valid_from, a.certificate_valid_to certificate_valid_to,',
            'a.created_on created_on, a.created_by created_by, a.last_modified_on last_modified_on, a.last_modified_by last_modified_by,',
            'b.created_on header_created_on, b.created_by header_created_by, b.last_modified_on header_last_modified_on, b.last_modified_by header_LAST_MODIFIED_BY',
            'from "' + Tables.version + '" a',
            'left outer join "' + Tables.configuration_header + '" b',
            'on a.addin_guid = b.addin_guid and a.addin_major_version = b.addin_major_version and a.addin_minor_version = b.addin_minor_version and a.addin_revision_number = b.addin_revision_number',
            'and a.addin_build_number = b.addin_build_number',
            sWhere
        ].join(' ');
        var oResult = dbConnection.executeQuery(sAddinsStmt);

        return oResult;
    };



    /**
	 * Gets addin version for given guid and version.
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {object} output - An array that contains addin versions
	 *
	 */
    this.getAddinVersion = async function (sGuid, aVersions) {

        var sAddinStmt = [
            'select addin_guid, addin_major_version, addin_minor_version, addin_revision_number,addin_build_number,',
            'name,full_qualified_name, description, publisher,',
            'status,',
            'certificate_issuer, certificate_subject, certificate_valid_from, certificate_valid_to,',
            'created_on, created_by, last_modified_on, last_modified_by',
            'from "' + Tables.version + '"',
            'where addin_guid = ? and addin_major_version = ? and addin_minor_version = ? and addin_revision_number = ? and addin_build_number = ?;'
        ].join(' ');

        var oAddinVersions = dbConnection.executeQuery(sAddinStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        if (oAddinVersions.length > 1) {
            const sLogMessage = `Corrupted db entries for addin with guid '${ sGuid }' and version '${ aVersions.join('.') }'.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        if (oAddinVersions.length === 0) {
            const sLogMessage = `Addin with guid '${ sGuid }' and version '${ aVersions.join('.') }' does not exist.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage);
        }

        return oAddinVersions[0];
    };


    /**
	 * Gets addin configuration for given guid and version.
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {object} output - An array that contains the configuration data for addin
	 */
    this.getAddinConfiguration = async function (sGuid, aVersions, bUsePreviousVersion) {
        var oResultAddinConfiguration = await getAddinConfigurationForVersion(sGuid, aVersions);

        if (oResultAddinConfiguration === undefined && bUsePreviousVersion === true) {
            // Deliver the configuration from one of previous versions if possible
            var stmt = [
                'select addin_guid, addin_major_version, addin_minor_version, addin_revision_number, addin_build_number',
                'from "' + Tables.configuration_header + '"',
                'where addin_guid=?',
                'order by addin_major_version, addin_minor_version, addin_revision_number, addin_build_number desc;'
            ].join(' ');
            var oPreviousVersions = dbConnection.executeQuery(stmt, sGuid);

            var i = 0;
            while (i < oPreviousVersions.length && oResultAddinConfiguration === undefined) {
                var aVersion = [
                    oPreviousVersions[i].ADDIN_MAJOR_VERSION,
                    oPreviousVersions[i].ADDIN_MINOR_VERSION,
                    oPreviousVersions[i].ADDIN_REVISION_NUMBER,
                    oPreviousVersions[i].ADDIN_BUILD_NUMBER
                ];
                oResultAddinConfiguration = await getAddinConfigurationForVersion(sGuid, aVersion);
                i++;
            }
        }
        return oResultAddinConfiguration;
    };


    /**
	 * Function to check whether the addin version exists.
	 * @param {String}
	 *            sGuid - GUID of the addin to delete
	 * @param {String}
	 *            sVersion - version string of the addin to delete
	 * @returns {boolean} - true if addin exists, otherwise false
	 */
    this.versionExists = function (sGuid, aVersions) {
        var sCountStmt = [
            'select count(*) as rowcount',
            'from "' + Tables.version + '"',
            'where addin_guid = ? and addin_major_version = ? and addin_minor_version = ? and addin_revision_number = ? and addin_build_number = ?'
        ].join(' ');
        var oCount = dbConnection.executeQuery(sCountStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        // check if any entries found
        return parseInt(oCount[0].ROWCOUNT) > 0;
    };

    /**
	 * Registers an addin. Creates a new addin version and configuration header in db.
	 *
	 * @param {object}
	 *            oAddinVersion - the object with the properties of the new addin from request
	 * @returns {object} oResultAddin - created addin version with configuration header
	 * @throws {PlcException}
	 *             if any exceptional state during the communication with the database occurs
	 */
    this.register = function (oAddinVersion) {
        var dCurrentDate = new Date();
        var sGuid = oAddinVersion.ADDIN_GUID;
        var sVersion = oAddinVersion.ADDIN_VERSION;
        var aVersions = sVersion.split('.');

        var aPropertiesToExclude = [
            'ADDIN_VERSION',
            'STATUS'
        ];

        var oGeneratedValues = {
            ADDIN_MAJOR_VERSION: aVersions[0],
            ADDIN_MINOR_VERSION: aVersions[1],
            ADDIN_REVISION_NUMBER: aVersions[2],
            ADDIN_BUILD_NUMBER: aVersions[3],
            STATUS: AddinStates.Registered,
            CREATED_ON: dCurrentDate,
            CREATED_BY: $.getPlcUsername(),
            LAST_MODIFIED_ON: dCurrentDate,
            LAST_MODIFIED_BY: $.getPlcUsername()
        };

        var oSettings = {
            TABLE: Tables.version,
            PROPERTIES_TO_EXCLUDE: aPropertiesToExclude,
            GENERATED_PROPERTIES: oGeneratedValues
        };

        // Insert new addin version
        return this.helper.insertNewEntity(oAddinVersion, oSettings);
    };


    /**
	 * Unregisters one addin with given guid and version. Deletes addin data from all addin tables.
	 *
	 * @param {String}
	 *            sGuid - GUID of the addin to delete
	 * @param {String}
	 *            sVersion - version string of the addin to delete
	 * @throws {PlcException} -
	 *             If the execution of the call statement to execute procedure fails.
	 */
    this.unregister = function (sGuid, aVersions) {
        var sWhere = 'where addin_guid = ? and addin_major_version = ? and addin_minor_version = ? and addin_revision_number = ? and addin_build_number = ?';

        var stmtVersion = [
            'delete from "' + Tables.version + '"',
            sWhere
        ].join(' ');
        dbConnection.executeUpdate(stmtVersion, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        var stmtConfigHeader = [
            'delete from "' + Tables.configuration_header + '"',
            sWhere
        ].join(' ');
        dbConnection.executeUpdate(stmtConfigHeader, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        var stmtConfigItems = [
            'delete from "' + Tables.configuration_items + '"',
            sWhere
        ].join(' ');
        dbConnection.executeUpdate(stmtConfigItems, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        return;
    };


    /**
	 * Updates an addin version, e.g. its status.
	 *
	 * @param {object}
	 *            oAddinVersion - addin version object from request
	 * @throws {PlcException} -
	 *             If the execution of the update statement would affect more that 1 row. This indicates a corrupted
	 *             query or illegal database state.
	 * @returns {oResultVersion} - updated version object
	 */
    this.updateVersion = function (oAddinVersion) {
        var aVersions = oAddinVersion.ADDIN_VERSION.split('.');

        var oUpdatedVersion = _.pick(oAddinVersion, 'STATUS');
        //set last_modifed at and by
        oUpdatedVersion.LAST_MODIFIED_ON = new Date();
        oUpdatedVersion.LAST_MODIFIED_BY = $.getPlcUsername();

        var oSettings = {
            TABLE: Tables.version,
            WHERE_PROPERTIES: {
                ADDIN_GUID: oAddinVersion.ADDIN_GUID,
                ADDIN_MAJOR_VERSION: aVersions[0],
                ADDIN_MINOR_VERSION: aVersions[1],
                ADDIN_REVISION_NUMBER: aVersions[2],
                ADDIN_BUILD_NUMBER: aVersions[3]
            }
        };

        // Update addin version
        return this.helper.updateEntity(oUpdatedVersion, oSettings);
    };


    /**
	 * Function to create a new configuration header in DB
	 * @param {String}
	 *            sGuid - GUID of the addin to delete
	 * @param {String}
	 *            sVersion - version string of the addin to delete
	 * @returns {object} oResultConfigurationHeader - new configuration header entity
	 */
    this.createConfigurationHeader = function (sGuid, aVersions) {
        var dChangeDate = new Date();
        var oConfigurationHeaderToUpdate = {
            ADDIN_GUID: sGuid,
            ADDIN_MAJOR_VERSION: aVersions[0],
            ADDIN_MINOR_VERSION: aVersions[1],
            ADDIN_REVISION_NUMBER: aVersions[2],
            ADDIN_BUILD_NUMBER: aVersions[3],
            CREATED_ON: dChangeDate,
            CREATED_BY: $.getPlcUsername(),
            LAST_MODIFIED_ON: dChangeDate,
            LAST_MODIFIED_BY: $.getPlcUsername()
        };

        var oSettings = {
            TABLE: Tables.configuration_header,
            PROPERTIES_TO_EXCLUDE: [],
            GENERATED_PROPERTIES: []
        };

        return this.helper.insertNewEntity(oConfigurationHeaderToUpdate, oSettings);
    };


    /**
	 * Function to update a configuration header in DB
	 * @param {String}
	 *            sGuid - GUID of the addin to delete
	 * @param {String}
	 *            sVersion - version string of the addin to delete
	 * @returns {object} oConfigurationHeaderToUpdate - updated configuration header entity
	 */
    this.updateConfigurationHeader = function (sGuid, aVersions) {
        var dChangeDate = new Date();
        var oConfigurationHeaderToUpdate = {
            LAST_MODIFIED_ON: dChangeDate,
            LAST_MODIFIED_BY: $.getPlcUsername()
        };
        // Update configuration header
        var oSettings = {
            TABLE: Tables.configuration_header,
            WHERE_PROPERTIES: {
                ADDIN_GUID: sGuid,
                ADDIN_MAJOR_VERSION: aVersions[0],
                ADDIN_MINOR_VERSION: aVersions[1],
                ADDIN_REVISION_NUMBER: aVersions[2],
                ADDIN_BUILD_NUMBER: aVersions[3]
            }
        };

        return this.helper.updateEntity(oConfigurationHeaderToUpdate, oSettings);
    };


    /**
	 * Function to update configuration items in DB
	 * @param {Array}
	 *            aConfigItems - array of addin configuration items
	 * @param {String}
	 *            sGuid - GUID of the addin to delete
	 * @param {String}
	 *            sVersion - version string of the addin to delete
	 * @returns {object} oConfigurationHeaderToUpdate - updated configuration header entity
	 */
    this.updateConfigurationItems = async function (aConfigItems, sGuid, aVersions) {
        // Remove old configuration items
        var sDeleteStmt = [
            'delete from "' + Tables.configuration_items + '"',
            'where addin_guid = ? and addin_major_version = ? and addin_minor_version = ? and addin_revision_number = ? and addin_build_number = ?'
        ].join(' ');
        dbConnection.executeUpdate(sDeleteStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        // Insert new configuration items
        var aInsertArgs = [];
        var aUpdatedConfigurationItems = [];
        _.each(aConfigItems, function (oConfig) {

            // Prepare objects for INSERT
            var aNewConfigItem = [
                sGuid,
                aVersions[0],
                aVersions[1],
                aVersions[2],
                aVersions[3],
                oConfig.CONFIG_KEY,
                oConfig.CONFIG_VALUE
            ];
            aInsertArgs.push(aNewConfigItem);

            aUpdatedConfigurationItems.push({
                CONFIG_KEY: oConfig.CONFIG_KEY,
                CONFIG_VALUE: oConfig.CONFIG_VALUE
            });
        });

        if (aInsertArgs.length > 0) {
            var iWrittenLines = dbConnection.executeUpdate('INSERT INTO "' + Tables.configuration_items + '" VALUES (?,?,?,?,?,?,?)', aInsertArgs);

            // check if number of written lines matches configuration items that should have been written
            if (iWrittenLines.length !== aUpdatedConfigurationItems.length) {
                const sLogMessage = `Not all configuration items requested (${ aUpdatedConfigurationItems.length }) could be written to database (${ iWrittenLines.length }).`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        return aUpdatedConfigurationItems;
    };


    /**
	 * Gets addin configuration header for given guid and version.
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {object} output - An array that contains the configuration header data
	 */
    async function getAddinConfigurationHeader(sGuid, aVersions) {

        // Get addin configuration header
        var sConfigHeaderStmt = [
            'select 	addin_guid, addin_major_version, addin_minor_version, addin_revision_number, addin_build_number, ',
            '			created_on, created_by, last_modified_on, last_modified_by',
            'from "' + Tables.configuration_header + '"',
            'where 		addin_guid=? and addin_major_version=? and addin_minor_version=? and addin_revision_number=? and addin_build_number=?;'
        ].join(' ');
        var oConfigHeader = dbConnection.executeQuery(sConfigHeaderStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        switch (oConfigHeader.length) {
        case 0:
            return undefined;
        case 1:
            return oConfigHeader[0];
        default: {
                const sLogMessage = `Corrupted db entries for addin with guid '${ sGuid }' and version '${ aVersions.join('.') }': more than 1 configuration header entries found.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    }

    /**
	 * Gets addin configuration items for given guid and version.
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {array} output - An array that contains the configuration items
	 */
    function getAddinConfigurationItems(sGuid, aVersions) {

        // Get addin configuration items
        var sConfigItemsStmt = [
            'select config_key, config_value',
            'from "' + Tables.configuration_items + '"',
            'where addin_guid=? and addin_major_version=? and addin_minor_version=? and addin_revision_number=? and addin_build_number=?;'
        ].join(' ');
        var oConfigItems = dbConnection.executeQuery(sConfigItemsStmt, sGuid, aVersions[0], aVersions[1], aVersions[2], aVersions[3]);

        return oConfigItems;
    }

    /**
	 * Helper to get addin configuration for the given guid and version.
	 * @param {String}
	 *            sGuid - Addin GUID
	 * @param {Array}
	 *            aVersions - Addin Version as array including major / minor / revision / build numbers
	 * @returns {object} oResultObject -  An addin object including header object and configuration items array.
	 */
    async function getAddinConfigurationForVersion(sGuid, aVersions) {

        var oConfigHeader = await getAddinConfigurationHeader(sGuid, aVersions);
        if (oConfigHeader === undefined) {
            return undefined;
        }

        // Get configuration items if the header exists
        var oConfigItems = await getAddinConfigurationItems(sGuid, aVersions);

        // Prepare result object
        var oResultObject = {
            'ConfigurationHeader': oConfigHeader,
            'ConfigurationItems': oConfigItems
        };

        return oResultObject;
    }

}

Addin.prototype = Object.create(Addin.prototype);
Addin.prototype.constructor = Addin;
export default {_,Helper,AddinStates,MessageLibrary,PlcException,Code,Tables,Addin};
