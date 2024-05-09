var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var MessageCode = $.require('../../../util/message').Code;

function CurrencyConversion(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    CurrencyConversion.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, oProcedureParameters.sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);
        oReturnObject[BusinessObjectsEntities.CURRENCY_CONVERSION_ENTITIES] = Array.slice(result.OT_CURRENCY_CONVERSIONS);

        return oReturnObject;
    };

    /* Initialization
	 * VALID_FROM should be parsed and the date will be extracted; from the frontend it comes as: "2015-06-19T00:00:00Z"
	*/
    CurrencyConversion.prototype.initializeColumns = async function (oRecord, sOperation, sObjectType) {
        if (!helpers.isNullOrUndefined(oRecord.VALID_FROM) && oRecord.VALID_FROM.length !== 10) {
            oRecord.VALID_FROM = oRecord.VALID_FROM.substring(0, 10);
        }
    };

    /* 
	 * Checks EXCHANGE_RATE_TYPE_ID exists in t_exchange_rate_type for Create and Upsert
	*/
    CurrencyConversion.prototype.validateAfter = async function () {
        var sSql = `update temp_table
						set	temp_table.ERROR_CODE = '${ MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR.code }',
						temp_table.ERROR_DETAILS = '{"businessObj":"'|| result.business_objects ||'","administrationObjType": "MainObj"}'
						from "sap.plc.db.administration::maintemporarytables.gtt_batch_currency_conversion" as temp_table,
						( select STRING_AGG( business_object, '"},{"businessObj":"') as business_objects, EXCHANGE_RATE_TYPE_ID
						  from 
						      ( select 'Exchange_Rate_Type' as business_object,  temp_table.EXCHANGE_RATE_TYPE_ID
								        from "sap.plc.db.administration::maintemporarytables.gtt_batch_currency_conversion" as temp_table
								        where (  temp_table.EXCHANGE_RATE_TYPE_ID is not null and temp_table.EXCHANGE_RATE_TYPE_ID not in ('','*') )
								        and temp_table.operation in ('Create', 'Upsert')
								        and (temp_table.error_code = '' or  temp_table.error_code is null)								        
								        minus								       
								       (select 'Exchange_Rate_Type' as business_object,  temp_table.EXCHANGE_RATE_TYPE_ID									        
                                        from "sap.plc.db.administration::maintemporarytables.gtt_batch_currency_conversion" as temp_table
									        inner join "sap.plc.db::basis.t_exchange_rate_type" as main_table
									        		on  main_table.EXCHANGE_RATE_TYPE_ID = temp_table.EXCHANGE_RATE_TYPE_ID
									        where (  temp_table.EXCHANGE_RATE_TYPE_ID is not null and temp_table.EXCHANGE_RATE_TYPE_ID not in ('','*') )
									        and temp_table.operation in ('Create', 'Upsert')
									        and (temp_table.error_code = '' or  temp_table.error_code is null)
									     )

						    ) group by EXCHANGE_RATE_TYPE_ID
						) as result
						where temp_table.EXCHANGE_RATE_TYPE_ID = result.EXCHANGE_RATE_TYPE_ID
						and temp_table.operation in ('Create', 'Upsert')
						and (temp_table.error_code = '' or  temp_table.error_code is null)`;

        await dbConnection.executeUpdate(sSql);
    };
}

CurrencyConversion.prototype = Object.create(MasterDataBaseObject.prototype);
CurrencyConversion.prototype.constructor = CurrencyConversion;
export default {helpers,BusinessObjectsEntities,MasterDataBaseObject,MessageCode,CurrencyConversion};
