var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectTypes = $.require('../../../util/constants').BusinessObjectTypes;
var Resources = $.require('../../../util/masterdataResources').MasterdataResource;
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var Helper = $.require('../../persistency-helper').Helper;
var Metadata = $.require('../../persistency-metadata').Metadata;
var WorkCenterCategories = $.require('../../../util/constants').WorkCenterCategories;
var MessageLibrary = $.require('../../../util/message');
var BatchOperation = $.require('../../../util/masterdataResources').BatchOperation;
var PlcException = MessageLibrary.PlcException;
var MessageDetails = MessageLibrary.Details;
var MessageCode = MessageLibrary.Code;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;
var Operation = MessageLibrary.Operation;
var BusinessObjectValidatorUtils = $.require('../../../validator/businessObjectValidatorUtils').BusinessObjectValidatorUtils;
var aAuditFieldsForVersionedEntries = [
    '_VALID_FROM',
    '_VALID_TO',
    '_SOURCE',
    '_CREATED_BY'
];
var aErrorFieldsInTemporaryTables = [
    'OPERATION',
    'ERROR_CODE',
    'ERROR_DETAILS',
    'ORIGINAL_ENTRY'
];
var currentUser = $.getPlcUsername();


async function WorkCenter(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);
    var helper = new Helper($, hQuery, dbConnection);
    var metadata = new Metadata($, hQuery, null, currentUser);

    WorkCenter.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sAutocompleteText, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.WORK_CENTER_ENTITIES] = Array.slice(result.OT_WORK_CENTER);
        oReturnObject[BusinessObjectsEntities.WORK_CENTER_TEXT_ENTITIES] = Array.slice(result.OT_WORK_CENTER_TEXT);
        oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
        oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
        oReturnObject[BusinessObjectsEntities.COST_CENTER_ENTITIES] = Array.slice(result.OT_COST_CENTER);
        oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
        oReturnObject[BusinessObjectsEntities.PROCESS_ENTITIES] = Array.slice(result.OT_PROCESS);
        oReturnObject[BusinessObjectsEntities.WORK_CENTER_PROCESS_ENTITIES] = Array.slice(result.OT_WORK_CENTER_PROCESS);
        oReturnObject[BusinessObjectsEntities.ACTIVITY_TYPE_ENTITIES] = Array.slice(result.OT_ACTIVITY_TYPE);
        oReturnObject[BusinessObjectsEntities.WORK_CENTER_ACTIVITY_ENTITIES] = Array.slice(result.OT_WORK_CENTER_ACTIVITY);
        return oReturnObject;
    };

    /**
	 * Determine all operations that are done by the user inside the batch request
	 * 
	 * @param   {object} oBatchItems - object that comes from the request containing all items that should be created/updated/deleted/upserted
	 * @param   {string} sSection - Section of business objects for whitch we want to determine the operations
     */

    WorkCenter.prototype.determineOtherOperations = async function (oBatchItems, sSection) {
        var currentOperation = [];
        /**
    	 * UPDATE Operation is not allowed for WORK CENTER PROCESS ENTITIES
         */
        if (!helpers.isNullOrUndefined(oBatchItems.UPDATE) && !helpers.isNullOrUndefined(oBatchItems.UPDATE[sSection]) && sSection === Resources[sObjectName].configuration.WorkCenterProcessSection && oBatchItems.UPDATE[sSection].length > 0 && this.ignoreBadData !== true) {
            const sLogMessage = `Method not allowed : ${ Operation.UPDATE } for WORK_CENTER_PROCESSES.`;
            $.trace.error(sLogMessage);
            var oMsgDetails = new MessageDetails();
            oMsgDetails.validationObj = {
                'Method not allowed': Operation.UPDATE,
                'validationInfoCode': MessageCode.GENERAL_METHOD_NOT_ALLOWED_ERROR.code
            };
            throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sLogMessage, oMsgDetails);
        }

        if (!helpers.isNullOrUndefined(oBatchItems.CREATE) && !helpers.isNullOrUndefined(oBatchItems.CREATE[sSection]) && oBatchItems.CREATE[sSection].length > 0) {
            currentOperation.push(Operation.CREATE);
        }
        if (sSection === Resources[sObjectName].configuration.WorkCenterActivitySection && !helpers.isNullOrUndefined(oBatchItems.UPDATE) && !helpers.isNullOrUndefined(oBatchItems.UPDATE[sSection]) && oBatchItems.UPDATE[sSection].length > 0) {
            currentOperation.push(Operation.UPDATE);
        }
        if (!helpers.isNullOrUndefined(oBatchItems.DELETE) && !helpers.isNullOrUndefined(oBatchItems.DELETE[sSection]) && oBatchItems.DELETE[sSection].length > 0) {
            currentOperation.push(Operation.DELETE);
        }
        if (!helpers.isNullOrUndefined(oBatchItems.UPSERT) && !helpers.isNullOrUndefined(oBatchItems.UPSERT[sSection]) && oBatchItems.UPSERT[sSection].length > 0) {
            currentOperation.push(Operation.UPSERT);
        }

        return currentOperation;
    };


    /**
	 * General logic in order to validate the data
	 * 
	 * @param   {object} oBatchItems - object that comes from the request containing all items that should be created/updated/deleted/upserted
	 */
    WorkCenter.prototype.validateAfter = async function (oBatchItems) {
        await validateWorkCenterCategories();
        var that = this;
        var currentTimestamp = this.context.MasterdataBusinessObject.currentTimestamp.toJSON();
        await deleteTemporaryTablesEntries();






        _.each(oBatchItems, async function (value, key) {
            var sOperation = '';
            var workCenterProcessEntities = oBatchItems[key][Resources.Work_Center.configuration.WorkCenterProcessSection];
            var workCenterActivityEntities = oBatchItems[key][Resources.Work_Center.configuration.WorkCenterActivitySection];
            if (key === BatchOperation.CREATE) {
                sOperation = Operation.CREATE;
            } else if (key === BatchOperation.UPDATE) {
                sOperation = Operation.UPDATE;
            } else if (key === BatchOperation.DELETE) {
                sOperation = Operation.DELETE;
            } else if (key === BatchOperation.UPSERT) {
                sOperation = Operation.UPSERT;
            }
            if (_.includes(that.currentProcessOperations, sOperation) && !helpers.isNullOrUndefined(workCenterProcessEntities) && !_.isEmpty(workCenterProcessEntities))
                await checkAndInsertIntoTemporaryTable(workCenterProcessEntities, sOperation, BusinessObjectTypes.WorkCenterProcess);

            if (_.includes(that.currentActivityOperations, sOperation) && !helpers.isNullOrUndefined(workCenterActivityEntities) && !_.isEmpty(workCenterActivityEntities))
                await checkAndInsertIntoTemporaryTable(workCenterActivityEntities, sOperation, BusinessObjectTypes.WorkCenterActivity);
        });

        if (_.includes(this.currentMainOperations, Operation.DELETE)) {
            await insertExistingWorkCenterProcessInTempTable(currentTimestamp);
            if (!_.includes(this.currentProcessOperations, Operation.DELETE)) {
                this.currentProcessOperations.push(Operation.DELETE);
            }

            await insertExistingWorkCenterActivitiesInTempTable(currentTimestamp);
            if (!_.includes(this.currentActivityOperations, Operation.DELETE)) {
                this.currentActivityOperations.push(Operation.DELETE);
            }
        }

        if (!_.isEmpty(this.currentActivityOperations)) {
            await validateEntriesInTemporaryTable(this.currentActivityOperations, currentTimestamp, BusinessObjectTypes.WorkCenterActivity);
        }

        if (!_.isEmpty(this.currentProcessOperations)) {
            await validateEntriesInTemporaryTable(this.currentProcessOperations, currentTimestamp, BusinessObjectTypes.WorkCenterProcess);
        }
    };




    async function validateWorkCenterCategories() {
        var aWorkCenterCategories = WorkCenterCategories.map(category => `'${ category }'`).join(',');
        var sStmt = `update temp_table
                        set temp_table.ERROR_CODE = 'GENERAL_VALIDATION_ERROR',
    					temp_table.ERROR_DETAILS = '{"validationObj": {"validationInfoCode": "VALUE_ERROR", "propertyInfo" : "Work Center Category"}, "businessObj": "${ sObjectName }"}'
                        from "${ Resources.Work_Center.dbobjects.tempTable }" as temp_table
                        where temp_table.WORK_CENTER_CATEGORY not in (${ aWorkCenterCategories })
                        and temp_table.operation in ('Create', 'Upsert', 'Update') 
    					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;

        await dbConnection.executeUpdate(sStmt);
    }







    async function insertExistingWorkCenterProcessInTempTable(currentTimestamp) {
        var sStmt = `insert into "${ Resources.Work_Center_Process.dbobjects.tempTable }" 
                        (WORK_CENTER_ID, PROCESS_ID, CONTROLLING_AREA_ID, PLANT_ID, _VALID_FROM, OPERATION, ERROR_CODE)
                            select main_process.WORK_CENTER_ID, main_process.PROCESS_ID, main_process.CONTROLLING_AREA_ID, main_process.PLANT_ID, main_process._VALID_FROM, 'Delete' as OPERATION, '' as ERROR_CODE
                                from ( select process.WORK_CENTER_ID, process.PROCESS_ID, process.CONTROLLING_AREA_ID, process.PLANT_ID, process._VALID_FROM
                                        from "${ Resources.Work_Center_Process.dbobjects.plcTable }" as process
                                        inner join "${ Resources.Work_Center.dbobjects.tempTable }" as temp_work_center
                                            on process.WORK_CENTER_ID = temp_work_center.WORK_CENTER_ID
                                            and process.PLANT_ID = temp_work_center.PLANT_ID
                                        where process._VALID_FROM <= TO_TIMESTAMP('${ currentTimestamp }') and process._VALID_TO is null 
                                            and temp_work_center.OPERATION = 'Delete'
                                            and ( temp_work_center.error_code = '' or  temp_work_center.error_code is null )) as main_process
                                left outer join "${ Resources.Work_Center_Process.dbobjects.tempTable }" as temp_process
                                    on main_process.WORK_CENTER_ID = temp_process.WORK_CENTER_ID and main_process.PROCESS_ID = temp_process.PROCESS_ID
                                    and main_process.CONTROLLING_AREA_ID = temp_process.CONTROLLING_AREA_ID and main_process.PLANT_ID = temp_process.PLANT_ID and main_process._VALID_FROM = temp_process._VALID_FROM
                                where temp_process.WORK_CENTER_ID is null and temp_process.CONTROLLING_AREA_ID is null and temp_process.PROCESS_ID is null
                                and temp_process.PLANT_ID is null and temp_process._VALID_FROM is null and temp_process._VALID_FROM is null;`;

        await dbConnection.executeUpdate(sStmt);
    }







    async function insertExistingWorkCenterActivitiesInTempTable(currentTimestamp) {
        var sStmt = `insert into "${ Resources.Work_Center_Activity.dbobjects.tempTable }" 
                        (WORK_CENTER_ID, ACTIVITY_TYPE_ID, CONTROLLING_AREA_ID, PLANT_ID, PROCESS_ID, _VALID_FROM, OPERATION, ERROR_CODE)
                            select main_activity.WORK_CENTER_ID, main_activity.ACTIVITY_TYPE_ID, main_activity.CONTROLLING_AREA_ID, main_activity.PLANT_ID, main_activity.PROCESS_ID, main_activity._VALID_FROM, 'Delete' as OPERATION, '' as ERROR_CODE
                                from ( select activity.WORK_CENTER_ID, activity.ACTIVITY_TYPE_ID, activity.CONTROLLING_AREA_ID, activity.PLANT_ID, activity.PROCESS_ID, activity._VALID_FROM
                                        from "${ Resources.Work_Center_Activity.dbobjects.plcTable }" as activity
                                        inner join "${ Resources.Work_Center.dbobjects.tempTable }" as temp_work_center
                                            on activity.WORK_CENTER_ID = temp_work_center.WORK_CENTER_ID
                                            and activity.PLANT_ID = temp_work_center.PLANT_ID
                                        where activity._VALID_FROM <= TO_TIMESTAMP('${ currentTimestamp }') and activity._VALID_TO is null 
                                            and temp_work_center.OPERATION = 'Delete'
                                            and ( temp_work_center.error_code = '' or  temp_work_center.error_code is null )) as main_activity
                                left outer join "${ Resources.Work_Center_Activity.dbobjects.tempTable }" as temp_activity
                                    on main_activity.WORK_CENTER_ID = temp_activity.WORK_CENTER_ID and main_activity.ACTIVITY_TYPE_ID = temp_activity.ACTIVITY_TYPE_ID and main_activity.CONTROLLING_AREA_ID = temp_activity.CONTROLLING_AREA_ID
                                    and main_activity.PLANT_ID = temp_activity.PLANT_ID and main_activity.PROCESS_ID = temp_activity.PROCESS_ID and main_activity._VALID_FROM = temp_activity._VALID_FROM
                                where temp_activity.WORK_CENTER_ID is null and temp_activity.ACTIVITY_TYPE_ID is null and temp_activity.CONTROLLING_AREA_ID is null and temp_activity.PROCESS_ID is null
                                and temp_activity.PLANT_ID is null and temp_activity._VALID_FROM is null;`;

        await dbConnection.executeUpdate(sStmt);
    }








    function createMasterdataObject(sCurrentObject, currentTimestamp) {
        var oReturnedObject = {
            sObjectName: sCurrentObject,
            currentTimestamp: currentTimestamp,
            tempTable: sCurrentObject === BusinessObjectTypes.WorkCenterActivity ? Resources.Work_Center_Activity.dbobjects.tempTable : Resources.Work_Center_Process.dbobjects.tempTable,
            plcTable: sCurrentObject === BusinessObjectTypes.WorkCenterActivity ? Resources.Work_Center_Activity.dbobjects.plcTable : Resources.Work_Center_Process.dbobjects.plcTable,
            aKeyColumns: sCurrentObject === BusinessObjectTypes.WorkCenterActivity ? Resources.Work_Center_Activity.configuration.aKeyColumns : Resources.Work_Center_Process.configuration.aKeyColumns,
            aTableColumns: _.difference(helper.getColumnsForTable(Resources[sCurrentObject].dbobjects.plcTable), aAuditFieldsForVersionedEntries),
            aKeyColumnsWithValidFrom: [],
            oKeyColumnsSelect: {},
            oKeyColumnsJoin: {}
        };

        oReturnedObject.aKeyColumnsWithValidFrom = _.union(oReturnedObject.aKeyColumns, ['_VALID_FROM']);
        oReturnedObject.oKeyColumnsSelect = (aKeyColumns => {
            var oReturnedObject = {
                tempTableAlias: [],
                mainTableAlias: []
            };
            _.each(aKeyColumns, function (value, key) {
                oReturnedObject.tempTableAlias.push(`temp_table.${ value }`);
                oReturnedObject.mainTableAlias.push(`main_table.${ value }`);
            });
            return oReturnedObject;
        })(oReturnedObject.aKeyColumns);

        oReturnedObject.oKeyColumnsJoin = (aKeyColumns => {
            var oReturnedObject = {};
            var joinTempMain = [];
            var joinTemp = [];
            var joinResult = [];
            var joinMainResult = [];
            _.each(aKeyColumns, function (value, key) {
                joinTempMain.push(`temp_table.${ value } = main_table.${ value }`);
                joinTemp.push(`temp_table.${ value } = inserted_duplicates.${ value }`);
                joinResult.push(`temp_table.${ value } = result.${ value }`);
                joinMainResult.push(`main_table.${ value } = result.${ value }`);
            });
            oReturnedObject.joinTempMain = joinTempMain.join(' and ');
            oReturnedObject.joinTemp = joinTemp.join(' and ');
            oReturnedObject.joinResult = joinResult.join(' and ');
            oReturnedObject.joinMainResult = joinMainResult.join(' and ');
            return oReturnedObject;
        })(oReturnedObject.aKeyColumns);

        return oReturnedObject;
    }









    async function validateEntriesInTemporaryTable(currentOperations, currentTimestamp, sCurrentObject) {
        var oCurrentObject = await new createMasterdataObject(sCurrentObject, currentTimestamp);
        if (sCurrentObject === BusinessObjectTypes.WorkCenterActivity) {
            if (_.includes(currentOperations, Operation.CREATE) || _.includes(currentOperations, Operation.UPSERT)) {
                await validateWorkCenter(oCurrentObject);
                await validateWorkCenterProcess(oCurrentObject);
                await validateActivityType(oCurrentObject);
                if (_.includes(currentOperations, Operation.CREATE)) {
                    await checkDuplicateEntries(oCurrentObject);
                }
            }
            if (_.includes(currentOperations, Operation.DELETE) || _.includes(currentOperations, Operation.UPDATE)) {
                await checkVersionedEntriesExist(oCurrentObject);
                await checkVersionedEntriesWithSourcePlc(oCurrentObject);
            }
            if (_.includes(currentOperations, Operation.CREATE) || _.includes(currentOperations, Operation.UPSERT) || _.includes(currentOperations, Operation.UPDATE)) {
                await checkLotSizeDependency(oCurrentObject);
            }
        }
        if (sCurrentObject === BusinessObjectTypes.WorkCenterProcess) {
            if (_.includes(currentOperations, Operation.CREATE) || _.includes(currentOperations, Operation.UPSERT)) {
                await validateWorkCenter(oCurrentObject);
                await validateProcess(oCurrentObject);
                await checkDuplicateEntries(oCurrentObject);
            }
            if (_.includes(currentOperations, Operation.DELETE)) {
                await checkVersionedEntriesExist(oCurrentObject);
                await checkVersionedEntriesWithSourcePlc(oCurrentObject);
                var oDependentObject = await new createMasterdataObject(BusinessObjectTypes.WorkCenterActivity, currentTimestamp);
                await checkUsedInBusinessObject(oCurrentObject, oDependentObject);
            }
        }
    }








    async function validateWorkCenter(oCurrentObject) {
        var sql = `update temp_table  
    					set temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }', 
    					temp_table.ERROR_DETAILS = '{"validationObj" : "${ sObjectName }"}' 
    					from  "${ oCurrentObject.tempTable }" as temp_table
    					where temp_table.WORK_CENTER_ID NOT IN
    					( select  temp_table.WORK_CENTER_ID from  "${ oCurrentObject.tempTable }"  as temp_table
        					inner join  "${ Resources.Work_Center.dbobjects.plcTable }" as main_table 
        					on  temp_table.WORK_CENTER_ID = main_table.WORK_CENTER_ID and  temp_table.CONTROLLING_AREA_ID = main_table.CONTROLLING_AREA_ID
        					and  temp_table.PLANT_ID = main_table.PLANT_ID 
        					and main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') and main_table._VALID_TO is null
        					and temp_table.operation in ('Create', 'Upsert')
        					and ( temp_table.error_code = '' or  temp_table.error_code is null ) 
        					union 
        					(SELECT  temp_table1.WORK_CENTER_ID from  "${ oCurrentObject.tempTable }"  as temp_table1 
        					INNER JOIN (SELECT 
        					                       temp_table2.WORK_CENTER_ID,  temp_table2.CONTROLLING_AREA_ID, temp_table2.PLANT_ID  
        					                        from  "${ Resources.Work_Center.dbobjects.tempTable }" as temp_table2 
        					                        where temp_table2.operation in ('Create', 'Upsert')
        						                    and ( temp_table2.error_code = '' or  temp_table2.error_code is null ) 
        					                        GROUP BY temp_table2.WORK_CENTER_ID,  temp_table2.CONTROLLING_AREA_ID,
        					                        temp_table2.PLANT_ID
        					                    ) as inserted_work_centers 
        					   ON  temp_table1.WORK_CENTER_ID = inserted_work_centers.WORK_CENTER_ID and  temp_table1.CONTROLLING_AREA_ID = inserted_work_centers.CONTROLLING_AREA_ID
        					   and temp_table1.PLANT_ID = inserted_work_centers.PLANT_ID
        					   and temp_table1.operation in ('Create', 'Upsert')
        					   and ( temp_table1.error_code = '' or  temp_table1.error_code is null ))
        					)
        					and temp_table.operation in ('Create', 'Upsert') 
        					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;

        await dbConnection.executeUpdate(sql);
    }








    async function validateWorkCenterProcess(oCurrentObject) {
        var sql = `update temp_table  
    					set temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }', 
    					temp_table.ERROR_DETAILS = '{"validationObj" : "${ BusinessObjectTypes.WorkCenterProcess }"}' 
    					from  "${ oCurrentObject.tempTable }" as temp_table
    					where (temp_table.PROCESS_ID NOT IN
    					( select  temp_table.PROCESS_ID from  "${ oCurrentObject.tempTable }"  as temp_table
        					inner join  "${ Resources.Work_Center_Process.dbobjects.plcTable }" as main_table 
        					on  temp_table.WORK_CENTER_ID = main_table.WORK_CENTER_ID and  temp_table.CONTROLLING_AREA_ID = main_table.CONTROLLING_AREA_ID
        					and  temp_table.PLANT_ID = main_table.PLANT_ID and temp_table.PROCESS_ID = main_table.PROCESS_ID 
        					and main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') and main_table._VALID_TO is null
        					and temp_table.operation in ('Create', 'Upsert')
        					and ( temp_table.error_code = '' or  temp_table.error_code is null ) 
        					union 
        					(SELECT  temp_table1.PROCESS_ID from  "${ oCurrentObject.tempTable }"  as temp_table1 
        					INNER JOIN (SELECT 
        					                       temp_table2.WORK_CENTER_ID,  temp_table2.CONTROLLING_AREA_ID, temp_table2.PLANT_ID, temp_table2.PROCESS_ID 
        					                        from  "${ Resources.Work_Center_Process.dbobjects.tempTable }" as temp_table2 
        					                        where temp_table2.operation in ('Create', 'Upsert')
        						                    and ( temp_table2.error_code = '' or  temp_table2.error_code is null ) 
        					                        GROUP BY temp_table2.WORK_CENTER_ID,  temp_table2.CONTROLLING_AREA_ID,
        					                        temp_table2.PLANT_ID, temp_table2.PROCESS_ID
        					                    ) as inserted_work_centers 
        					   ON  temp_table1.WORK_CENTER_ID = inserted_work_centers.WORK_CENTER_ID and  temp_table1.CONTROLLING_AREA_ID = inserted_work_centers.CONTROLLING_AREA_ID
        					   and temp_table1.PLANT_ID = inserted_work_centers.PLANT_ID and temp_table1.PROCESS_ID = inserted_work_centers.PROCESS_ID
        					   and temp_table1.operation in ('Create', 'Upsert')
        					   and ( temp_table1.error_code = '' or  temp_table1.error_code is null ))
        					) and temp_table.PROCESS_ID <> '*')
        					and temp_table.operation in ('Create', 'Upsert') 
        					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;


        await dbConnection.executeUpdate(sql);
    }







    async function validateActivityType(oCurrentObject) {
        var sql = `update temp_table  
    					set temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }', 
    					temp_table.ERROR_DETAILS = '{"validationObj" : "${ BusinessObjectTypes.ActivityType }"}' 
    					from  "${ oCurrentObject.tempTable }" as temp_table
    					where temp_table.ACTIVITY_TYPE_ID NOT IN
    					( select  temp_table.ACTIVITY_TYPE_ID from  "${ oCurrentObject.tempTable }"  as temp_table
        					inner join  "${ Resources.Activity_Type.dbobjects.plcTable }" as main_table 
        					on  temp_table.ACTIVITY_TYPE_ID = main_table.ACTIVITY_TYPE_ID and  temp_table.CONTROLLING_AREA_ID = main_table.CONTROLLING_AREA_ID
        					and main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') and main_table._VALID_TO is null
        					and temp_table.operation in ('Create', 'Upsert')
        					and ( temp_table.error_code = '' or  temp_table.error_code is null ))
    					and temp_table.operation in ('Create', 'Upsert') 
    					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;


        await dbConnection.executeUpdate(sql);
    }








    async function validateProcess(oCurrentObject) {
        var sql = `update temp_table  
    					set temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }', 
    					temp_table.ERROR_DETAILS = '{"validationObj" : "${ BusinessObjectTypes.Process }"}' 
    					from  "${ oCurrentObject.tempTable }" as temp_table
    					where temp_table.PROCESS_ID NOT IN
    					( select  temp_table.PROCESS_ID from  "${ oCurrentObject.tempTable }"  as temp_table
        					inner join  "${ Resources.Process.dbobjects.plcTable }" as main_table 
        					on  temp_table.PROCESS_ID = main_table.PROCESS_ID and  temp_table.CONTROLLING_AREA_ID = main_table.CONTROLLING_AREA_ID
        					and main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') and main_table._VALID_TO is null
        					and temp_table.operation in ('Create', 'Upsert')
        					and ( temp_table.error_code = '' or  temp_table.error_code is null ))
    					and temp_table.operation in ('Create', 'Upsert') 
    					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;


        await dbConnection.executeUpdate(sql);
    }






    async function checkDuplicateEntries(oCurrentObject) {
        var sql = `update temp_table   
    				set temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_DUPLICATE_ERROR.code }', 
    				temp_table.ERROR_DETAILS = '{"administrationObjType": "MainObj", "businessObj": "${ oCurrentObject.sObjectName }"}'
    				from "${ oCurrentObject.tempTable }" as temp_table, 
    				(select  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias } from "${ oCurrentObject.tempTable }" as temp_table
    				    inner join  "${ oCurrentObject.plcTable }" as main_table 
    				    on ${ oCurrentObject.oKeyColumnsJoin.joinTempMain } and
    				    main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') and main_table._VALID_TO is null
    				    and temp_table.operation in ('Create', 'Upsert')
    				    and ( temp_table.error_code = '' or  temp_table.error_code is null ) 
    				union 
    				(SELECT  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias } from  "${ oCurrentObject.tempTable }"  as temp_table 
    				    INNER JOIN (SELECT 
    					                       ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }, COUNT(*) AS CountOf  
    					                        from  "${ oCurrentObject.tempTable }" as temp_table
    					                        where temp_table.operation in ('Create', 'Upsert')
    						                    and ( temp_table.error_code = '' or  temp_table.error_code is null ) 
    					                        GROUP BY  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }
    					                        HAVING COUNT(*) > 1 
    					                    ) as inserted_duplicates 
    					   ON  ${ oCurrentObject.oKeyColumnsJoin.joinTemp } and
    					   temp_table.operation in ('Create', 'Upsert') 
    					   and ( temp_table.error_code = '' or  temp_table.error_code is null ))
    				) as result
    				where  ${ oCurrentObject.oKeyColumnsJoin.joinResult } and
    				temp_table.operation in ('Create', 'Upsert') 
    				and ( temp_table.error_code = '' or  temp_table.error_code is null );`;

        await dbConnection.executeUpdate(sql);
    }








    async function checkVersionedEntriesExist(oCurrentObject) {
        var sql = `update temp_table
    				set	temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }',
                    temp_table.ERROR_DETAILS = '{"administrationObjType": "MainObj", "businessObj": "${ oCurrentObject.sObjectName }"}' 
    			    from "${ oCurrentObject.tempTable }" as temp_table,
    				( select  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }, temp_table._VALID_FROM
    				from  "${ oCurrentObject.tempTable }"  as temp_table
    				where temp_table.operation in ('Delete', 'Update') 
    				and ( temp_table.error_code = '' or  temp_table.error_code is null ) 
    				minus 
    				select ${ oCurrentObject.aKeyColumnsWithValidFrom }
    				from (select  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }, temp_table._VALID_FROM 
    				       from  "${ oCurrentObject.tempTable }" as temp_table 
    					   inner join "${ oCurrentObject.plcTable }" as main_table 
    					   on  ${ oCurrentObject.oKeyColumnsJoin.joinTempMain }
    					   and temp_table._VALID_FROM = main_table._VALID_FROM
    					    and main_table._VALID_TO is null
    						 and temp_table.operation in ('Delete', 'Update') 
    						and ( temp_table.error_code = '' or  temp_table.error_code is null ))  
    				 ) as result 
    				where  ${ oCurrentObject.oKeyColumnsJoin.joinResult }
    				and temp_table._VALID_FROM = result._VALID_FROM
    				and temp_table.operation in ('Delete', 'Update') 
    				and ( temp_table.error_code = '' or  temp_table.error_code is null );`;

        await dbConnection.executeUpdate(sql);
    }







    async function checkVersionedEntriesWithSourcePlc(oCurrentObject) {
        var sql = `update temp_table 
					set	temp_table.ERROR_CODE = 'GENERAL_VALIDATION_ERROR',
					temp_table.ERROR_DETAILS = '{"validationObj": {"validationInfoCode": "SOURCE_ERP"}, "businessObj": "${ oCurrentObject.sObjectName }"}'
					from "${ oCurrentObject.tempTable }" as temp_table,
					(select ${ oCurrentObject.aKeyColumnsWithValidFrom } 
					from (select  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }, temp_table._VALID_FROM
        					from "${ oCurrentObject.tempTable }" as temp_table  
    					    inner join "${ oCurrentObject.plcTable }"  as main_table 
    						on  ${ oCurrentObject.oKeyColumnsJoin.joinTempMain }
    						and temp_table._VALID_FROM = main_table._VALID_FROM
    						and temp_table.operation in ('Delete', 'Update') 
    						and (temp_table.error_code = '' or  temp_table.error_code is null) 
    						where main_table._SOURCE = 2) 
					) as result 
					where ${ oCurrentObject.oKeyColumnsJoin.joinResult }  and temp_table._VALID_FROM = result._VALID_FROM
					and temp_table.operation in ('Delete', 'Update') 
					and (temp_table.error_code = '' or  temp_table.error_code is null);`;

        await dbConnection.executeUpdate(sql);
    }






    async function checkLotSizeDependency(oCurrentObject) {
        var sql = `update temp_table
                        set temp_table.ERROR_CODE = 'GENERAL_VALIDATION_ERROR',
                        temp_table.ERROR_DETAILS = '{"validationObj": {"validationInfoCode": "VALUE_ERROR"}, "businessObj": "${ oCurrentObject.sObjectName }"}'
                    	from "${ oCurrentObject.tempTable }" as temp_table
                	       where
                	        ((temp_table.LOT_SIZE is not null and temp_table.TOTAL_QUANTITY_DEPENDS_ON <> 2) OR
                	        ((temp_table.LOT_SIZE is null OR temp_table.LOT_SIZE = 0) AND temp_table.TOTAL_QUANTITY_DEPENDS_ON = 2))
                			and temp_table.operation in ('Update', 'Create', 'Upsert')
                			and ( temp_table.error_code = '' or  temp_table.error_code is null )`;

        await dbConnection.executeUpdate(sql);
    }









    async function checkUsedInBusinessObject(oCurrentObject, oDependentObject) {
        var sql = `update temp_table
                        set temp_table.ERROR_CODE = 'GENERAL_VALIDATION_ERROR',
                        temp_table.ERROR_DETAILS = '{"validationObj": { "dependencyObjects": [{"businessObj":"${ oDependentObject.sObjectName }"}],"validationInfoCode": "DEPENDENCY_ERROR"}, "businessObj": "${ oCurrentObject.sObjectName }"}'
                        from "${ oCurrentObject.tempTable }" as temp_table,
                        (select count(*) as rowNumber 
                            from (select ${ oDependentObject.oKeyColumnsSelect.mainTableAlias }
                				from  "${ oDependentObject.plcTable }" as main_table
                				        inner join "${ oCurrentObject.tempTable }" as temp_table
                    				on ${ oCurrentObject.oKeyColumnsJoin.joinTempMain } 
                    			    and main_table._VALID_FROM <= TO_TIMESTAMP('${ oDependentObject.currentTimestamp }') and main_table._VALID_TO is null
                    			    and temp_table.OPERATION in ('Delete')
            				minus 
                				select  ${ oDependentObject.oKeyColumnsSelect.tempTableAlias }
                				    from  "${ oDependentObject.tempTable }" as temp_table
                				        inner join "${ oCurrentObject.tempTable }" as main_table
                    				on ${ oCurrentObject.oKeyColumnsJoin.joinTempMain } 
                    			    and ( temp_table.error_code = '' or  temp_table.error_code is null )
                    			    and temp_table.OPERATION in ('Delete'))) as result 
    				    where result.rowNumber > 0
    				    and temp_table.operation in ('Delete') 
    					and ( temp_table.error_code = '' or  temp_table.error_code is null );`;

        await dbConnection.executeUpdate(sql);
    }




    WorkCenter.prototype.processAfter = async function () {
        var currentTimestamp = this.context.MasterdataBusinessObject.currentTimestamp.toJSON();
        if (!_.isEmpty(this.currentActivityOperations)) {
            await processEntries(this.currentActivityOperations, this.ignoreBadData, currentTimestamp, BusinessObjectTypes.WorkCenterActivity);
        }

        if (!_.isEmpty(this.currentProcessOperations)) {
            await processEntries(this.currentProcessOperations, this.ignoreBadData, currentTimestamp, BusinessObjectTypes.WorkCenterProcess);
        }
    };









    async function processEntries(currentOperation, ignoreBadData, currentTimestamp, sCurrentObject) {
        var oCurrentObject = await new createMasterdataObject(sCurrentObject, currentTimestamp);
        if (_.includes(currentOperation, Operation.DELETE) || _.includes(currentOperation, Operation.UPDATE)) {
            await mainUpdateVersionedEntries(ignoreBadData, oCurrentObject);
        }
        if (_.includes(currentOperation, Operation.UPSERT) && sCurrentObject === BusinessObjectTypes.WorkCenterActivity) {
            await mainUpdateCurrentVersionedEntries(ignoreBadData, oCurrentObject);
        }
        if (_.includes(currentOperation, Operation.CREATE) || _.includes(currentOperation, Operation.UPDATE) || _.includes(currentOperation, Operation.UPSERT)) {
            await mainInsertVersionedEntries(ignoreBadData, oCurrentObject);
        }
    }







    async function mainInsertVersionedEntries(ignoreBadData, oCurrentObject) {
        var sql = `insert into "${ oCurrentObject.plcTable }"
    				(${ oCurrentObject.aTableColumns }, ${ aAuditFieldsForVersionedEntries })
    				select distinct  ${ oCurrentObject.aTableColumns },
    								TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }') as _valid_from,
    								null as _valid_to,
    								1 as _source,
    								'${ currentUser }' as _created_by
    				from "${ oCurrentObject.tempTable }" as temp_table, 
    				(select count(error_code) as number_of_errors from "${ oCurrentObject.tempTable }"
    				   where error_code <> '') as error_table
    				where  temp_table.operation in ('Create', 'Upsert', 'Update') and (error_table.number_of_errors = 0 OR
        (temp_table.error_code = '' AND '${ ignoreBadData }' = 'true'));`;

        await dbConnection.executeUpdate(sql);
    }








    async function mainUpdateCurrentVersionedEntries(ignoreBadData, oCurrentObject) {
        var sql = `update main_table 
                	set _VALID_TO = TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }'), 
                	_created_by = '${ currentUser }'
                	from "${ oCurrentObject.plcTable }" as main_table,
                	(select distinct ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias } , temp_table._VALID_FROM 
                	  from "${ oCurrentObject.tempTable }" as temp_table,
                	  (select count(error_code) as number_of_errors from "${ oCurrentObject.tempTable }"
                	   where error_code <> '') as error_table
                	   where  temp_table.operation in ('Upsert') and (error_table.number_of_errors = 0 OR 
                	    (temp_table.error_code = '' AND '${ ignoreBadData }' = 'true'))
                	) as result 
                	where ${ oCurrentObject.oKeyColumnsJoin.joinMainResult }
                	and main_table._VALID_FROM = result._VALID_FROM
                	and main_table._VALID_FROM <= TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }')
                    and main_table._VALID_TO is null
                    and main_table._SOURCE = 1;`;

        await dbConnection.executeUpdate(sql);
    }







    async function mainUpdateVersionedEntries(ignoreBadData, oCurrentObject) {
        var sql = `update main_table
    				set _VALID_TO = TO_TIMESTAMP('${ oCurrentObject.currentTimestamp }'), 
    				_created_by = '${ currentUser }'
    				from "${ oCurrentObject.plcTable }" as main_table,
    				(select distinct  ${ oCurrentObject.oKeyColumnsSelect.tempTableAlias }, temp_table._VALID_FROM 
    				  from "${ oCurrentObject.tempTable }" as temp_table,
    				  (select count(error_code) as number_of_errors from "${ oCurrentObject.tempTable }"
    				   where error_code <> '') as error_table
    				   where  temp_table.operation in ('Delete', 'Update') and (error_table.number_of_errors = 0 OR
        				(temp_table.error_code = '' AND '${ ignoreBadData }' = 'true'))
    				) as result 
    				where  ${ oCurrentObject.oKeyColumnsJoin.joinMainResult } and main_table._VALID_FROM = result._VALID_FROM
    			    and main_table._VALID_TO is null;`;

        await dbConnection.executeUpdate(sql);
    }








    async function checkAndInsertIntoTemporaryTable(aBatchItems, sOperation, sObjectName) {
        var sTempTableName = Resources[sObjectName].dbobjects.tempTable;
        var fieldsMain = _.difference(helper.getColumnsForTable(Resources[sObjectName].dbobjects.plcTable), aAuditFieldsForVersionedEntries);
        var aTableColumns = _.union(fieldsMain, aAuditFieldsForVersionedEntries, aErrorFieldsInTemporaryTables);
        var aMetadataFields = await getMetadataForAllFields(metadata, sObjectName);


        var aStmtBuilder = [`insert into "${ sTempTableName }"`];
        aStmtBuilder.push('(' + aTableColumns.join(',') + ')');
        var aValuePlaceHolder = _.map(aTableColumns, function () {
            return '?';
        });
        aStmtBuilder.push('VALUES (' + aValuePlaceHolder.join(',') + ')');
        var aInsertValues = [];

        _.each(aBatchItems, async function (oRecord) {
            var oEntry = {};
            try {
                await checkColumnsUsingMetadata(oRecord, aMetadataFields, sOperation);
                checkMandatoryProperties(oRecord, sObjectName, sOperation);
                oEntry = oRecord;
                oEntry.OPERATION = sOperation;
                oEntry.ERROR_CODE = '';
                oEntry.ERROR_DETAILS = '';
                oEntry.ORIGINAL_ENTRY = '';
            } catch (e) {
                oEntry.OPERATION = sOperation;
                oEntry.ERROR_CODE = e.code.code;
                if (!helpers.isNullOrUndefined(e.details))
                    oEntry.ERROR_DETAILS = JSON.stringify(e.details);
                oEntry.ORIGINAL_ENTRY = JSON.stringify(oRecord);
            }
            var aItemValues = [];
            _.each(aTableColumns, function (sColumnName) {
                if (_.has(oEntry, sColumnName)) {
                    aItemValues.push(oEntry[sColumnName]);
                } else {
                    aItemValues.push(null);
                }
            });
            aInsertValues.push(aItemValues);
        });

        var sStmt = aStmtBuilder.join(' ');
        await dbConnection.executeUpdate(sStmt, aInsertValues);
    }








    function getMetadataForAllFields(oMetadata, sObjectName) {
        var aMetadataFields = oMetadata.getMetadataFields(sObjectName, sObjectName, null);
        return aMetadataFields;
    }










    async function checkColumnsUsingMetadata(oEntry, aMetadataFields, sOperation) {

        if (!_.isObject(oEntry)) {
            var oMsgDetails = new MessageDetails();
            oMsgDetails.validationObj = { 'validationInfoCode': ValidationInfoCode.SYNTACTIC_ERROR };

            const sClientMsg = 'Error in checkColumnsUsingMetadata: oEntry must be a valid object.';
            const sServerMsg = `${ sClientMsg } oEntry: ${ JSON.stringify(oEntry) }`;
            $.trace.error(sServerMsg);
            throw new PlcException(MessageCode.GENERAL_VALIDATION_ERROR, sClientMsg, oMsgDetails);
        }

        var aColumns = _.keys(oEntry);
        var aValues = _.values(oEntry);
        var oValidationUtils = await new BusinessObjectValidatorUtils();
        _.each(aColumns, function (oColumns, iColIndex) {
            oValidationUtils.checkColumn(aMetadataFields, aColumns[iColIndex], aValues[iColIndex]);
        });
    }








    function checkMandatoryProperties(oEntry, sObjectName, sOperation) {
        let aMandatoryProperties = Resources[sObjectName].configuration.aKeyColumns;
        if ((sOperation === Operation.DELETE || sOperation === Operation.UPDATE) && Resources[sObjectName].configuration.IsVersioned) {
            aMandatoryProperties = _.union(aMandatoryProperties, ['_VALID_FROM']);
        }

        MasterDataBaseObject.prototype.checkMandatoryNotNullProperties(oEntry, aMandatoryProperties);
    }




    async function deleteTemporaryTablesEntries() {
        var sStmt = `DELETE FROM "${ Resources.Work_Center_Process.dbobjects.tempTable }"`;
        await dbConnection.executeUpdate(sStmt);

        sStmt = `DELETE FROM "${ Resources.Work_Center_Activity.dbobjects.tempTable }"`;
        await dbConnection.executeUpdate(sStmt);
    }
}
WorkCenter.prototype = Object.create(MasterDataBaseObject.prototype);
WorkCenter.prototype.constructor = WorkCenter;
export default {_,helpers,BusinessObjectTypes,Resources,BusinessObjectsEntities,MasterDataBaseObject,Helper,Metadata,WorkCenterCategories,MessageLibrary,BatchOperation,PlcException,MessageDetails,MessageCode,ValidationInfoCode,Operation,BusinessObjectValidatorUtils,aAuditFieldsForVersionedEntries,aErrorFieldsInTemporaryTables,currentUser,WorkCenter};
