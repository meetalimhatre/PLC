var _ = $.require('lodash');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var MessageLibrary = $.require('../../../util/message');
var Operation = MessageLibrary.Operation;
var MessageCode = MessageLibrary.Code;
var Resources = $.require('../../../util/masterdataResources').MasterdataResource;
var ValidationInfoCode = MessageLibrary.ValidationInfoCode;

function Vendor(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Vendor.prototype.getDataUsingSqlProcedure = function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};

        var oFilters = [
            [
                'VENDOR_ID',
                'plcTable.VENDOR_ID'
            ],
            [
                'VENDOR_NAME',
                'plcTable.VENDOR_NAME'
            ],
            [
                'COUNTRY',
                'plcTable.COUNTRY'
            ],
            [
                'POSTAL_CODE',
                'plcTable.POSTAL_CODE'
            ],
            [
                'REGION',
                'plcTable.REGION'
            ],
            [
                'CITY',
                'plcTable.CITY'
            ],
            [
                'STREET_NUMBER_OR_PO_BOX',
                'plcTable.STREET_NUMBER_OR_PO_BOX'
            ],
            [
                '_SOURCE',
                'plcTable._SOURCE'
            ]
        ];

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = fnProcedure(oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
            oReturnObject[BusinessObjectsEntities.VENDOR_ENTITIES] = Array.slice(result.OT_VENDOR);

        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let stmt = `	select
                     			plcTable.VENDOR_ID,
                     			plcTable.VENDOR_NAME,
                     			plcTable.COUNTRY,
                     			plcTable.POSTAL_CODE,
                     			plcTable.REGION,
                     			plcTable.CITY,
                     			plcTable.STREET_NUMBER_OR_PO_BOX,
                     			plcTable._SOURCE
                    		from "sap.plc.db::basis.t_vendor" as plcTable
                    		where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
                    			and ( plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null ) 
                    			and ( LOWER(plcTable.VENDOR_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
                    			or LOWER(plcTable.VENDOR_NAME) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                stmt += ` and ${ filter }`;
            }
            stmt += ` order by VENDOR_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            oReturnObject[BusinessObjectsEntities.VENDOR_ENTITIES] = _.values(dbConnection.executeQuery(stmt));
        }

        return oReturnObject;
    };

    Vendor.prototype.validateBefore = function () {

        var sqlMain = 'update temp_table' + " set temp_table.ERROR_CODE = '" + MessageCode.GENERAL_VALIDATION_ERROR.code + "'," + ' temp_table.ERROR_DETAILS = \'{"validationObj": { "columnIds": [{"columnId":"VENDOR_ID' + '"}],"validationInfoCode": "' + ValidationInfoCode.VALUE_ERROR + '"}}\'' + ' from "' + Resources[sObjectName].dbobjects.tempTable + '" as temp_table' + "    where temp_table.VENDOR_ID in ('DELETED')" + "    and temp_table.operation in ('" + Operation.CREATE + "')" + "    and (temp_table.error_code = '' or  temp_table.error_code is null)";

        dbConnection.executeUpdate(sqlMain);
    };
}

Vendor.prototype = await Object.create(MasterDataBaseObject.prototype);
Vendor.prototype.constructor = Vendor;
export default {_,BusinessObjectsEntities,MasterDataBaseObject,MessageLibrary,Operation,MessageCode,Resources,ValidationInfoCode,Vendor};
