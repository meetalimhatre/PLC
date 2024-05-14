const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;

const HelperObjectTypes = require('../util/constants').HelperObjectTypes;
const sRetentionPeriods = HelperObjectTypes.RetentionPeriods;

module.exports.RetentionPeriods = function ($) {
    /**
 * Handles a HTTP POST request to add new retention periods for customer, vendor, project and user.
 * 
 */
    var sUserId = $.getPlcUsername();

    this.create = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {

        let aInsertedPeriods = await oPersistency.RetentionPeriods.create(oBodyItems);
        if (aInsertedPeriods.includes(-301)) {
            let sClientMsg = 'Record(s) already exists in personal data validity table.';
            let sServerMsg = `${ sClientMsg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_DUPLICATE_ERROR, sClientMsg);
        }

        await addAuditLog();

        oServiceOutput.setBody(oBodyItems);
        oServiceOutput.setStatus($.net.http.CREATED);
        return oServiceOutput;
    };

    /**
     * Handles a HTTP GET request to add new retention periods for customer, vendor, project and user.
     * 
     */
    this.get = async function (oBodyData, oParameters, oServiceOutput, oPersistency) {
        let aRetentionPeriods = oPersistency.RetentionPeriods.getAllRetentionData();
        oServiceOutput.setBody(aRetentionPeriods);
        oServiceOutput.setStatus($.net.http.OK);
        return oServiceOutput;
    };

    /**
     * Handles a HTTP DELETE request to delete retention periods for customer, vendor, project and user.
     * 
     */
    this.remove = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {

        let aDeletedPeriods = oPersistency.RetentionPeriods.deletePeriods(oBodyItems);
        if (!aDeletedPeriods.every(item => item === 1)) {
            let sClientMsg = 'Record(s) not found in personal data validity table.';
            let sServerMsg = `${ sClientMsg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        await addAuditLog();

        oServiceOutput.setStatus($.net.http.OK);
        return oServiceOutput;
    };

    /**
     * Handles a HTTP PUT request to update retention periods for customer, vendor, project and user.
     * 
     */
    this.update = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {

        let aUpdatedItems = await oPersistency.RetentionPeriods.update(oBodyItems);
        if (!aUpdatedItems.every(item => item === 1)) {
            let sClientMsg = 'Record(s) not found in personal data validity table.';
            let sServerMsg = `${ sClientMsg }`;
            $.trace.error(sServerMsg);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
        }

        await addAuditLog();

        oServiceOutput.setStatus($.net.http.OK);
        oServiceOutput.setBody(oBodyItems);
        return oServiceOutput;
    };

    async function addAuditLog() {
        $.trace.error(`[INFO] Retention table is maintained by: [${ sUserId }] on [${ new Date().toString() }]`);
        await auditLog.read({
            type: sRetentionPeriods,
            id: { key: `TimeStamp: [${ new Date().toString() }]` }
        }).attribute({
            name: 'TimeStamp',
            successful: true
        }).dataSubject({
            type: 'SAP',
            id: { key: 'PLC' },
            role: 'RetentionPeriodsEdit'
        }).accessChannel('UI').by(`[${ sUserId }]`).log(async function (err) {
            if (err) {
                $.trace.error(`Edit retention periods. Error when logging using AuditLog`);
            }
        });
    }

};
export default {MessageLibrary,PlcException,Message,Code,Severity,MessageDetails,HelperObjectTypes,sRetentionPeriods};
