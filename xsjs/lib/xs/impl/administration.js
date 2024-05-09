const _ = require('lodash');
const helpers = require('../util/helpers');
const Constants = require('../util/constants');
const BusinessObjectTypes = Constants.BusinessObjectTypes;

const MasterDataConstants = require('../util/masterdataResources');
const BatchOperation = MasterDataConstants.BatchOperation;

const MessageLibrary = require('../util/message');
const MessageOperation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MasterDataObjectTypes = require('../util/constants').MasterDataObjectTypes;
const sVendor = MasterDataObjectTypes.Vendor;
const sCustomer = MasterDataObjectTypes.Customer;

module.exports.Administration = function ($) {

    var sUserId = $.getPlcUsername();

    /**
 * Gets the configuration data for a specific business object
 *
 * @param oBodyData      {object}  - not needed here
 * @param oParameters    {object}  - object of parameters
 * @param oServiceOutput {object}  - instance of ServiceOutput
 * @param oPersistency   {object}  - instance of persistency
 * 
 * @returns oServiceOutput {object} - the response
 */
    this.get = async function (oBodyData, oParameters, oServiceOutput, oPersistency) {

        var sSessionId = $.getPlcUsername();
        var oMsg = {};
        var oMsgDetails = {};

        var mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);

        try {
            var administration = oPersistency.Administration.getAdministration(oParameters, mSessionDetails.language, new Date());
            if (oParameters.business_object === sVendor) {
                $.trace.error(`[INFO] Vendor table is read by user: [${ sUserId }] on [${ new Date().toString() }]`);
                await auditLog.read({
                    type: sVendor,
                    id: { key: `TimeStamp: [${ new Date().toString() }]` }
                }).attribute({
                    name: 'TimeStamp',
                    successful: true
                }).dataSubject({
                    type: 'SAP',
                    id: { key: 'PLC' },
                    role: 'VendorRead'
                }).accessChannel('UI').by(`[${ sUserId }]`).log(async function (err) {
                    if (err) {
                        $.trace.error(`Read Vendor. Error when logging using AuditLog`);
                    }
                });
            }
            if (oParameters.business_object === sCustomer) {
                $.trace.error(`[INFO] Customer table is read by user: [${ sUserId }] on [${ new Date().toString() }]`);
                await auditLog.read({
                    type: sCustomer,
                    id: { key: `TimeStamp: [${ new Date().toString() }]` }
                }).attribute({
                    name: 'TimeStamp',
                    successful: true
                }).dataSubject({
                    type: 'SAP',
                    id: { key: 'PLC' },
                    role: 'CustRead'
                }).accessChannel('UI').by(`[${ sUserId }]`).log(async function (err) {
                    if (err) {
                        $.trace.error(`Read Customer. Error when logging using AuditLog`);
                    }
                });
            }
            if (_.has(administration, 'transactionaldata'))
                oServiceOutput.setTransactionalData(administration.transactionaldata);
            oServiceOutput.setMasterdata(_.omit(administration, ['transactionaldata']));
        } catch (e) {
            oMsg.code = e.code;
            oMsg.type = e.type;
            oMsg.severity = e.severity;
            oMsg.operation = MessageOperation.READ;
            oMsgDetails.message = 'Masterdata Object(s) could not be read';
            oMsg.message_details = oMsgDetails;
            oServiceOutput.addMessage(oMsg);
            oServiceOutput.setStatus($.net.http.BAD_REQUEST);
        }
    };

    /**
 * Creates/Updates/Deletes one or more masterdata objects -> used for batch processing
 *
 * @param oBodyData        {object} - object that contains 3 sections (CREATE/DELETE/UPDATE)
 * @param oParameters      {object} - object of parameters
 * @param oServiceOutput   {object} - instance of ServiceOutput
 * @param oPersistency     {object} - instance of persistency
 * @returns oServiceOutput {object} - the response
 */
    this.edit = async function (oBodyData, oParameters, oServiceOutput, oPersistency) {

        var oResultSet = {};
        var oResultSetInsert = {};
        var oResultSetUpdate = {};
        var oResultSetDelete = {};
        var oResultSetCheck = {};
        var aResultSetErrors = [];
        var isBatchSuccess = true;

        var sObjectName = oParameters.business_object;
        var sIgnoreBadData = oParameters.ignoreBadData === true ? true : false;
        var bCostingSheetRowsDependenciesHaveErrors = false;
        var sMasterDataDate = new Date().toISOString();

        if (sObjectName === BusinessObjectTypes.AccountGroup || sObjectName === BusinessObjectTypes.ComponentSplit || sObjectName === BusinessObjectTypes.CostingSheet || sObjectName === BusinessObjectTypes.CostingSheetRow || sObjectName === BusinessObjectTypes.ExchangeRateType) {

            //I055799: change it later when Account Group, Component Split, Costing Sheet, Price Source will be refactores

            if (!helpers.isNullOrUndefined(oBodyData[BatchOperation.DELETE]))
                oResultSetDelete = oPersistency.Administration.deleteAdministration(sObjectName, oBodyData[BatchOperation.DELETE], sMasterDataDate);

            if (sObjectName === BusinessObjectTypes.AccountGroup || sObjectName === BusinessObjectTypes.ComponentSplit || sObjectName === BusinessObjectTypes.CostingSheet || sObjectName === BusinessObjectTypes.CostingSheetRow) {
                if (!helpers.isNullOrUndefined(oBodyData[BatchOperation.CREATE]))
                    oResultSetInsert = oPersistency.Administration.insertAdministration(sObjectName, oBodyData[BatchOperation.CREATE], sMasterDataDate);

                if (!helpers.isNullOrUndefined(oBodyData[BatchOperation.UPDATE]))
                    oResultSetUpdate = oPersistency.Administration.updateAdministration(sObjectName, oBodyData[BatchOperation.UPDATE], sMasterDataDate);

                if (sObjectName === BusinessObjectTypes.CostingSheet && (oResultSetInsert !== {} || oResultSetUpdate !== {}) && (await helpers.isNullOrUndefined(oResultSetInsert.hasErrors) || oResultSetInsert.hasErrors === false) && (await helpers.isNullOrUndefined(oResultSetUpdate.hasErrors) || oResultSetUpdate.hasErrors === false)) {
                    oResultSetCheck = oPersistency.Administration.checkIfTotalFieldsAreValidForCostingSheetRows(sObjectName, oBodyData[BatchOperation.CREATE], oBodyData[BatchOperation.UPDATE], sMasterDataDate);
                }
            } else {
                if (!helpers.isNullOrUndefined(oBodyData[BatchOperation.UPDATE]))
                    oResultSetUpdate = oPersistency.Administration.updateAdministration(sObjectName, oBodyData[BatchOperation.UPDATE], sMasterDataDate);

                if (!helpers.isNullOrUndefined(oBodyData[BatchOperation.CREATE]))
                    oResultSetInsert = oPersistency.Administration.insertAdministration(sObjectName, oBodyData[BatchOperation.CREATE], sMasterDataDate);

            }

            if (!helpers.isNullOrUndefined(oResultSetDelete.hasErrors) && oResultSetDelete.hasErrors) {
                aResultSetErrors = aResultSetErrors.concat(oResultSetDelete.errors);
                isBatchSuccess = false;
            }

            if (!helpers.isNullOrUndefined(oResultSetUpdate.hasErrors) && oResultSetUpdate.hasErrors) {
                aResultSetErrors = aResultSetErrors.concat(oResultSetUpdate.errors);
                isBatchSuccess = false;
            }

            if (!helpers.isNullOrUndefined(oResultSetInsert.hasErrors) && oResultSetInsert.hasErrors) {
                aResultSetErrors = aResultSetErrors.concat(oResultSetInsert.errors);
                isBatchSuccess = false;
            }

            if (!helpers.isNullOrUndefined(oResultSetCheck.hasErrors) && oResultSetCheck.hasErrors) {
                aResultSetErrors = aResultSetErrors.concat(oResultSetCheck.errors);
                isBatchSuccess = false;
                bCostingSheetRowsDependenciesHaveErrors = true;
            }

            if (isBatchSuccess === true || sIgnoreBadData === true && !bCostingSheetRowsDependenciesHaveErrors) {
                //we stop partial save for the case when there are dependecy errors for costing sheet rows to assure consistency
                oResultSet[BatchOperation.CREATE] = oResultSetInsert.entities;
                oResultSet[BatchOperation.UPDATE] = oResultSetUpdate.entities;
                oResultSet[BatchOperation.DELETE] = oResultSetDelete.entities;
                oServiceOutput.setMasterdata(oResultSet).setStatus($.net.http.CREATED);
                if (aResultSetErrors.length > 0) {
                    _.each(aResultSetErrors, function (oMsg) {
                        oServiceOutput.addMessage(oMsg);
                    });
                }
            } else {
                oServiceOutput.setStatus($.net.http.BAD_REQUEST);
                _.each(aResultSetErrors, function (oMsg) {
                    oServiceOutput.addMessage(oMsg);
                });

                const sLogMessage = `Administration data cannot be saved.`;
                throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
            }
        } else {
            if (oBodyData.VALIDATION.hasErrors === true) {
                _.each(oBodyData.VALIDATION.errors, function (oMsg) {
                    oServiceOutput.addMessage(oMsg);
                });
                if (sIgnoreBadData !== true) {
                    oServiceOutput.setStatus($.net.http.BAD_REQUEST);

                    const sLogMessage = `Administration data cannot be saved.`;
                    throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
                }
            }
            oResultSet = oPersistency.Administration.batchAdministration(oBodyData.BOBJECT);
            if (sObjectName === sVendor) {
                $.trace.error(`[INFO] Vendor table is maintained by user: [${ sUserId }] on [${ new Date().toString() }]`);
                const message = (await auditLog.update({
                    type: sVendor,
                    id: { key: `TimeStamp: [${ sMasterDataDate.toString() }]` }
                })).attribute({
                    name: 'TimeStamp',
                    old: 'oldValue',
                    new: `[${ sMasterDataDate.toString() }]`
                }).dataSubject({
                    type: 'SAP',
                    id: { key: 'PLC' },
                    role: 'VendorEdit'
                }).by(`[${ sUserId }]`);
                message.logPrepare(function (err) {
                    message.logSuccess(async function (err) {
                        if (err) {
                            $.trace.error(`Edit Vendor. Error when logging success using AuditLog`);
                        }
                    });

                    message.logFailure(async function (err) {
                        if (err) {
                            $.trace.error(`Edit Vendor. Error when logging failure using AuditLog`);
                        }
                    });
                });
            }
            if (sObjectName === sCustomer) {
                $.trace.error(`[INFO] Customer table is maintained by user: [${ sUserId }] on [${ new Date().toString() }]`);
                const message = (await auditLog.update({
                    type: sCustomer,
                    id: { key: `TimeStamp: [${ sMasterDataDate.toString() }]` }
                })).attribute({
                    name: 'TimeStamp',
                    old: 'oldValue',
                    new: `[${ sMasterDataDate.toString() }]`
                }).dataSubject({
                    type: 'SAP',
                    id: { key: 'PLC' },
                    role: 'CustEdit'
                }).by(`[${ sUserId }]`);
                message.logPrepare(function (err) {
                    message.logSuccess(async function (err) {
                        if (err) {
                            $.trace.error(`Edit Customer. Error when logging success using AuditLog`);
                        }
                    });

                    message.logFailure(async function (err) {
                        if (err) {
                            $.trace.error(`Edit Customer. Error when logging failure using AuditLog`);
                        }
                    });
                });
            }
            oServiceOutput.setMasterdata(oResultSet).setStatus($.net.http.CREATED);
        }

    };

};
export default {_,helpers,Constants,BusinessObjectTypes,MasterDataConstants,BatchOperation,MessageLibrary,MessageOperation,PlcException,Code,MasterDataObjectTypes,sVendor,sCustomer};
