var _ = $.require('lodash');
var helpers = $.require('../../../util/helpers');
var BusinessObjectsEntities = $.require('../../../util/masterdataResources').BusinessObjectsEntities;
var MasterDataBaseObject = await $.import('xs.db.administration.factory', 'masterDataBaseObject').MasterDataBaseObject;
var apiHelpers = await $.import('xs.db.administration', 'api-helper');
var CompanyCode = await $.import('xs.db.administration.factory', 'companyCode');
var ControllingArea = await $.import('xs.db.administration.factory', 'controllingArea');

function Plant(dbConnection, hQuery, sObjectName) {

    MasterDataBaseObject.apply(this, arguments);

    Plant.prototype.getDataUsingSqlProcedure = async function (fnProcedure, oProcedureParameters) {
        var oReturnObject = {};
        var sControllingAreaId = '';
        var sSqlFilter = '';

        var oFilters = [
            [
                'PLANT_ID',
                'plcTable.PLANT_ID'
            ],
            [
                'PLANT_DESCRIPTION',
                'plcTextTable.PLANT_DESCRIPTION'
            ],
            [
                'COMPANY_CODE_ID',
                'plcTable.COMPANY_CODE_ID'
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

        if (oProcedureParameters.sUrlFilter !== '') {
            var filterObject = await apiHelpers.getFilterObjectFromFilterString(oProcedureParameters.sUrlFilter, this.aMetadataFields);
            if (!helpers.isNullOrUndefined(filterObject.CONTROLLING_AREA_ID)) {
                sControllingAreaId = filterObject.CONTROLLING_AREA_ID;
            }
        }
        sSqlFilter = oProcedureParameters.sSqlFilter;

        if (oProcedureParameters.bAutocompleteIsNullOrUndefined === true) {
            var result = await fnProcedure(oProcedureParameters.sLanguage, oProcedureParameters.sMasterDataDate, sSqlFilter, oProcedureParameters.iTopRecords, oProcedureParameters.iSkipRecords);

            oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = Array.slice(result.OT_PLANT);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = Array.slice(result.OT_COMPANY_CODE);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = Array.slice(result.OT_CONTROLLING_AREA);
            oReturnObject[BusinessObjectsEntities.PLANT_TEXT_ENTITIES] = Array.slice(result.OT_PLANT_TEXT);

        } else {
            let masterdataTimestamp = oProcedureParameters.sMasterDataDate.toJSON();
            let aCompanyCodesIds = [];
            if (sControllingAreaId !== '') {
                aCompanyCodesIds = await CompanyCode.getCompanyCodeEntitiesForControllingArea(sControllingAreaId, masterdataTimestamp, dbConnection);
            }
            let stmt = `select  
    	                    	plcTable.PLANT_ID,
    	      					plcTable.COMPANY_CODE_ID,
    	      					plcTable.COUNTRY,
    	      					plcTable.POSTAL_CODE,
    	      					plcTable.REGION,
    	      					plcTable.CITY,
    	      					plcTable.STREET_NUMBER_OR_PO_BOX,
    	      					plcTable._SOURCE,
    	      					plcTextTable.PLANT_DESCRIPTION	                    
    	                    from "sap.plc.db::basis.t_plant" as plcTable 
    	                    left outer join "sap.plc.db::basis.t_plant__text" as plcTextTable 
    	                        on  plcTable.PLANT_ID = plcTextTable.PLANT_ID 
    	                        and plcTextTable.LANGUAGE = '${ oProcedureParameters.sLanguage }' 
    	                        and plcTextTable._VALID_FROM <= '${ masterdataTimestamp }' 
    	                        and (plcTextTable._VALID_TO > '${ masterdataTimestamp }' or plcTextTable._VALID_TO is null)  
    	                    where plcTable._VALID_FROM <= '${ masterdataTimestamp }' 
    	                        and (plcTable._VALID_TO > '${ masterdataTimestamp }' or plcTable._VALID_TO is null) 
    	                        and (LOWER(plcTable.PLANT_ID) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%')
								or LOWER(plcTextTable.PLANT_DESCRIPTION) LIKE LOWER('${ oProcedureParameters.sAutocompleteText }%') )`;

            if (aCompanyCodesIds && aCompanyCodesIds.length > 0) {
                aCompanyCodesIds = aCompanyCodesIds.map(companyCodesId => `'${ companyCodesId }'`).join(',');
                stmt += `and ( plcTable.COMPANY_CODE_ID in ( ${ aCompanyCodesIds }))`;
            }

            if (oProcedureParameters.sSqlFilter !== '') {
                let filter = oProcedureParameters.sSqlFilter;
                /*
        	    *  The plant entities can be filtered by the id of controlling area, and in this case the CONTROLLING_AREA_ID argument must be 
        	    * removed from the oProcedureParameters.sSqlFilter string.
        	    */
                if (sControllingAreaId !== '') {
                    let aFilterArguments = filter.split('AND');
                    filter = '';
                    for (let i = 0; i < aFilterArguments.length; i++) {
                        if (aFilterArguments[i].indexOf('CONTROLLING_AREA_ID') < 0) {
                            filter += `${ aFilterArguments[i] } AND `;
                        }
                    }
                    filter = filter.slice(0, -5);
                }

                for (let i = 0; i < oFilters.length; i++) {
                    filter = filter.replace(oFilters[i][0], oFilters[i][1]);
                }
                if (filter !== '')
                    stmt += ` and ${ filter }`;
            }
            stmt += ` order by plcTable.PLANT_ID`;
            stmt += ` limit ${ oProcedureParameters.iTopRecords } offset ${ oProcedureParameters.iSkipRecords }`;
            const rsPlant = await dbConnection.executeQuery(stmt);
            oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES] = _.values(rsPlant);

            const dependentPlants = await helpers.transposeResultArrayOfObjects(oReturnObject[BusinessObjectsEntities.PLANT_ENTITIES], true);
            oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES] = await CompanyCode.getCompanyCodeEntities(dependentPlants.COMPANY_CODE_ID, masterdataTimestamp, oProcedureParameters.sLanguage, dbConnection);

            const dependentCompanyCodes = await helpers.transposeResultArrayOfObjects(oReturnObject[BusinessObjectsEntities.COMPANY_CODE_ENTITIES], true);
            oReturnObject[BusinessObjectsEntities.CONTROLLING_AREA_ENTITIES] = await ControllingArea.getControllingAreaEntities(dependentCompanyCodes.CONTROLLING_AREA_ID, masterdataTimestamp, oProcedureParameters.sLanguage, dbConnection);
        }

        return oReturnObject;

    };
}

Plant.prototype = Object.create(MasterDataBaseObject.prototype);
Plant.prototype.constructor = Plant;
export default {_,helpers,BusinessObjectsEntities,MasterDataBaseObject,apiHelpers,CompanyCode,ControllingArea,Plant};
