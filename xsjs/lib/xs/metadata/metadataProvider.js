const _ = require('lodash');
const helpers = require('../util/helpers');

const Constants = require('../util/constants');
const MapStandardFieldsWithFormulas = Constants.mapStandardFieldsWithFormulas;

const MessageLibrary = require('../util/message');
const Operation = MessageLibrary.Operation;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;
const Severity = MessageLibrary.Severity;

const oValidItemCustFieldNameRegexp = /^CUST_[A-Z][A-Z0-9_]*$/;
const aFrontendOnlyMetadata = ['PRICE_SPLIT_COMPONENTS'];

var Procedures = await Object.freeze({ p_metadata_get_for_item: 'sap.plc.db.administration.procedures::p_metadata_get_for_item' });

async function logError(msg) {
    await helpers.logError(msg);
}

/**
 * Processes raw metadata information (stored in external .xsjslib files) and provides access to this processed meta information. The result
 * of the processing are stored inside the created instance to avoid expensive re-calculation. Hence, if possible instances of the
 * MetadataProvider shall be reused.
 * 
 * @constructor
 */
function MetadataProvider() {

    /**
	 * Gets the metadata for all the categories.
	 * 
	 * @param sPath
	 *            {string} - path is used to navigate through the client side models (business objects)
	 * @param sBusinessObject
	 *            {string} - the Business Object's name
	 * @param sColumnId
	 *            {string} - the id of the column
     * @param sSessionId
     *            {string} - the id of the session for which the details shall be retrieved
	 * @param sUserId
	 *            {string} - (current) user id
	 * @returns aReturnedObj {array} - an array containing all the metadata
	 */
    this.get = async function (sPath, sBusinessObject, sColumnId, bIsCustom, oPersistency, sSessionId, sUserId) {
        var aReturnedObj = [], aDbAttributes = [], aText = [], aFormulas = [], aSelectionFilter = [], aSelectionDisplayed = [];
        var aMetadataFields, aMetadataText, aMetadataAttributes, aMetadataFormulas, mSessionDetails, aMetadataSelectionFilter, aMetadataSelectionDisplayed;

        // Special handling for call from validateItemsUpdate() in itemValidator for performance improvement. The improvement is
        // combine multiple DB select queries into one procedure call
        //   - to reduce DB call time comsumption
        //   - to increase xsjs instance concurrent throughput
        if (Constants.BusinessObjectTypes.Item === sPath && Constants.BusinessObjectTypes.Item === sBusinessObject && null === sColumnId && null === bIsCustom) {
            var fnGetMetadata = (await oPersistency.getConnection()).loadProcedure(Procedures.p_metadata_get_for_item);
            var oResults = fnGetMetadata(sSessionId, sUserId).$resultSets;

            aMetadataFields = oResults[0];
            aMetadataText = oResults[1];
            aMetadataAttributes = oResults[2];
            aMetadataFormulas = oResults[3];
            mSessionDetails = oResults[4];
            aMetadataSelectionFilter = oResults[5];
            aMetadataSelectionDisplayed = oResults[6];
        }

        // if metadata are not returned, fall back to default handlings
        if (await helpers.isNullOrUndefined(aMetadataFields)) {
            sPath = sPath === undefined ? null : sPath;
            sBusinessObject = sBusinessObject === undefined ? null : sBusinessObject;
            sColumnId = sColumnId === undefined ? null : sColumnId;
            bIsCustom = bIsCustom === undefined ? null : bIsCustom;






            aMetadataFields = oPersistency.Metadata.getMetadataFields(sPath, sBusinessObject, sColumnId, bIsCustom);
            aMetadataText = oPersistency.Metadata.getMetadataText(sPath, sColumnId);
            aMetadataAttributes = oPersistency.Metadata.getMetadataItemAttributes(sPath, sBusinessObject, sColumnId);
            aMetadataFormulas = oPersistency.Metadata.getMetadataFormulas(sPath, sBusinessObject, sColumnId);
            if (aMetadataFormulas.length > 0) {
                aMetadataFormulas.forEach(oFormula => {
                    if (oFormula.PATH === 'Item' && oFormula.BUSINESS_OBJECT === 'Item' && oFormula.COLUMN_ID === 'QUANTITY') {
                        const oVariantFormula = Object.assign({}, oFormula);
                        oVariantFormula.BUSINESS_OBJECT = 'Variant_Item';
                        oVariantFormula.PATH = 'Variant_Item';
                        aMetadataFormulas.push(oVariantFormula);
                    }
                });
            }
            if (aMetadataText.length !== 0) {
                mSessionDetails = oPersistency.Session.getSessionDetails(sSessionId, sUserId);
            }
            aMetadataSelectionFilter = oPersistency.Metadata.getMetadataSelectionFilter(sPath, sBusinessObject, sColumnId);
            aMetadataSelectionDisplayed = oPersistency.Metadata.getMetadataSelectionDisplayed(sPath, sBusinessObject, sColumnId);
        }


        _.each(aMetadataFields, async function (metadataObj) {

            aText = _.filter(aMetadataText, function (oMetadaText) {
                return oMetadaText.COLUMN_ID === metadataObj.COLUMN_ID && oMetadaText.PATH === metadataObj.PATH;
            });

            _.each(aText, function (oText) {
                if (oText.LANGUAGE === mSessionDetails.language) {
                    metadataObj.DISPLAY_NAME = oText.DISPLAY_NAME;
                    metadataObj.DISPLAY_DESCRIPTION = oText.DISPLAY_DESCRIPTION;
                }
            });

            metadataObj.TEXT = aText;







            var bPathStartsWithItem = metadataObj.PATH.indexOf(Constants.BusinessObjectTypes.Item) === 0;
            function bVariantItemWithQuantity() {
                var aVariantItemMetadata = [
                    'QUANTITY',
                    'QUANTITY_UOM_ID',
                    'IS_INCLUDED'
                ];
                const bPathStartsWithVariantItem = metadataObj.PATH.indexOf(Constants.TansactionalObjectTyps.VariantItem) === 0;
                const bColumnIdIsQuantity = aVariantItemMetadata.includes(metadataObj.COLUMN_ID);
                return bPathStartsWithVariantItem && bColumnIdIsQuantity;
            }
            aDbAttributes = _.filter(aMetadataAttributes, function (oMetadaAttribute) {
                return oMetadaAttribute.COLUMN_ID === metadataObj.COLUMN_ID && oMetadaAttribute.PATH === metadataObj.PATH && oMetadaAttribute.BUSINESS_OBJECT === metadataObj.BUSINESS_OBJECT;
            });
            metadataObj.ATTRIBUTES = bPathStartsWithItem || await bVariantItemWithQuantity() ? await computeCompleteItemMetadataAttributes(aDbAttributes) : aDbAttributes;
            if (await bVariantItemWithQuantity()) {
                metadataObj.ATTRIBUTES.push(aDbAttributes[0]);
            }

            aFormulas = _.filter(aMetadataFormulas, function (oMetadaFormula) {
                return oMetadaFormula.COLUMN_ID === metadataObj.COLUMN_ID && oMetadaFormula.PATH === metadataObj.PATH && oMetadaFormula.BUSINESS_OBJECT === metadataObj.BUSINESS_OBJECT;
            });
            metadataObj.FORMULAS = aFormulas;

            aSelectionFilter = _.filter(aMetadataSelectionFilter, function (oMetadaSelectionFilter) {
                return oMetadaSelectionFilter.COLUMN_ID === metadataObj.COLUMN_ID && oMetadaSelectionFilter.PATH === metadataObj.PATH && oMetadaSelectionFilter.BUSINESS_OBJECT === metadataObj.BUSINESS_OBJECT;
            });
            metadataObj.SELECTION_FILTER = aSelectionFilter;

            aSelectionDisplayed = _.filter(aMetadataSelectionDisplayed, function (oMetadaSelectionDisplayed) {
                return oMetadaSelectionDisplayed.COLUMN_ID === metadataObj.COLUMN_ID && oMetadaSelectionDisplayed.PATH === metadataObj.PATH && oMetadaSelectionDisplayed.BUSINESS_OBJECT === metadataObj.BUSINESS_OBJECT;
            });
            metadataObj.SELECTION_DISPLAYED = aSelectionDisplayed;

            aReturnedObj.push(metadataObj);
        });
        return aReturnedObj;
    };



















    function computeCompleteItemMetadataAttributes(aDbMetadataAttributes) {
        var aComputedMetadataAttributes = [];
        var iItemCategoryCount = Object.keys(Constants.ItemCategory).length;
        _.each(aDbMetadataAttributes, async function (oDbAttribute) {
            if (oDbAttribute.ITEM_CATEGORY_ID === -1) {
                for (var iCategoryId = 0; iCategoryId < iItemCategoryCount; iCategoryId++) {
                    await computeCategroyMetadata(iCategoryId, oDbAttribute);
                }
            } else {
                await computeCategroyMetadata(oDbAttribute.ITEM_CATEGORY_ID, oDbAttribute);
            }
        });

        function computeCategroyMetadata(iCategoryId, oDbAttribute) {


            if (oDbAttribute.SUBITEM_STATE === -1) {

                for (let iSubitemState = 0; iSubitemState < 2; iSubitemState++) {
                    let oExplicitMetadataAttribute = _.clone(oDbAttribute);
                    oExplicitMetadataAttribute.ITEM_CATEGORY_ID = iCategoryId;
                    oExplicitMetadataAttribute.SUBITEM_STATE = iSubitemState;
                    aComputedMetadataAttributes.push(oExplicitMetadataAttribute);
                }
            } else {

                aComputedMetadataAttributes.push(_.clone(oDbAttribute));
            }
        }
        return aComputedMetadataAttributes;
    }

























    this.getColumnsForCategories = function (sPath, sBusinessObject, oPersistency) {

        var aColumnCategoryCombination = oPersistency.Metadata.getColumnsForCategories(sPath, sBusinessObject);

        var aWildcardColumns = [];
        var mColumnsPerCategoryWithoutWildCard = {};



        _.each(aColumnCategoryCombination, function (oColumnCategory) {
            if (oColumnCategory.ITEM_CATEGORY_ID < 0) {

                if (oColumnCategory.IS_CUSTOM === 1 && oColumnCategory.UOM_CURRENCY_FLAG !== 1) {

                    aWildcardColumns.push(oColumnCategory.COLUMN_ID + '_MANUAL');
                    if (oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID))
                        aWildcardColumns.push(oColumnCategory.COLUMN_ID + '_IS_MANUAL');
                } else {

                    aWildcardColumns.push(oColumnCategory.COLUMN_ID);
                }

            } else {
                if (!_.has(mColumnsPerCategoryWithoutWildCard, oColumnCategory.ITEM_CATEGORY_ID)) {
                    mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID] = [];
                }
                if (oColumnCategory.IS_CUSTOM === 1 && oColumnCategory.UOM_CURRENCY_FLAG !== 1) {

                    mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID + '_MANUAL');
                    if (oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID))
                        mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID + '_IS_MANUAL');
                } else {

                    if (!aFrontendOnlyMetadata.includes(oColumnCategory.COLUMN_ID)) {
                        mColumnsPerCategoryWithoutWildCard[oColumnCategory.ITEM_CATEGORY_ID].push(oColumnCategory.COLUMN_ID);
                    }
                }

            }
        });






        var mColumnsPerCategory = {};
        if (_.keys(mColumnsPerCategoryWithoutWildCard).length > 0) {
            _.each(mColumnsPerCategoryWithoutWildCard, function (aColumnsWithoutWildCard, sCategoryId) {
                mColumnsPerCategory[sCategoryId] = _.union(aWildcardColumns, aColumnsWithoutWildCard);
            });
        } else if (aWildcardColumns.length > 0) {
            mColumnsPerCategory[-1] = aWildcardColumns;
        }

        return mColumnsPerCategory;
    };















    this.getCustomFieldsWithDefaultValuesForCategories = function (sPath, sBusinessObject, oPersistency, oGeneralDefaultValues) {

        const aColumnCategoryCombination = oPersistency.Metadata.getCustomFieldsWithDefaultValuesForCategories(sPath, sBusinessObject);

        let mColumnsPerCategoryWithDefaultValues = {};

        aColumnCategoryCombination.forEach((oColumnCategory, index) => {
            let sColumnName;
            let oDefaultValue;


            if (!mColumnsPerCategoryWithDefaultValues.hasOwnProperty(oColumnCategory.ITEM_CATEGORY_ID)) {
                mColumnsPerCategoryWithDefaultValues[oColumnCategory.ITEM_CATEGORY_ID] = {};
            }

            oDefaultValue = oColumnCategory.DEFAULT_VALUE;
            if (oColumnCategory.UOM_CURRENCY_FLAG !== 1) {

                sColumnName = oColumnCategory.COLUMN_ID + `_MANUAL`;
            } else {

                sColumnName = oColumnCategory.COLUMN_ID;

                if (oColumnCategory.PROPERTY_TYPE === 7 && oValidItemCustFieldNameRegexp.test(oColumnCategory.COLUMN_ID)) {
                    oDefaultValue = oGeneralDefaultValues.ReportingCurrency;
                }
            }
            mColumnsPerCategoryWithDefaultValues[oColumnCategory.ITEM_CATEGORY_ID][sColumnName] = oDefaultValue;
        });

        return mColumnsPerCategoryWithDefaultValues;
    };













    this.batchCreateUpdateDelete = async function (aBodyMeta, oPersistency, checkCanExecute) {
        var aResultSetCreateSuccess = [], aResultSetCreateFailed = [];
        var aResultSetDeleteSucess = [], aResultSetDeleteFailed = [];
        var aResultSetUpdateSucess = [], aResultSetUpdateFailed = [];
        var aResult = {};
        var isBatchSuccess = true;
        var oResult = {};
        let aStandardFieldsWithFormulas = Array.from(MapStandardFieldsWithFormulas.keys());

        oPersistency.Metadata.setTransactionAutocommitDDLOff();




        var aCustomFieldTriggerUnitChange = [];



        var aCustomFieldTriggerManualChange = [];



        var aStandardFieldTriggerManualChange = [];
        var aCustomFieldTriggerDefaultValueChange = [];

        _.each(aBodyMeta, async function (aBatchItems, sItemKey) {
            if (sItemKey === 'CREATE') {



                await generateTableDisplayOrder(aBatchItems, oPersistency);

                _.each(aBatchItems, async function (oMeta) {
                    try {
                        var oMetaResponse = await createObj(oMeta, oPersistency);
                        aResultSetCreateSuccess.push(oMetaResponse);
                        if (oMetaResponse.IS_CUSTOM === 1) {
                            aCustomFieldTriggerUnitChange.push(oMeta);
                            if (!_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMetaResponse.BUSINESS_OBJECT) && oMetaResponse.UOM_CURRENCY_FLAG === 0) {
                                aCustomFieldTriggerManualChange.push(oMeta);
                            }



                            if (oMetaResponse.SEMANTIC_DATA_TYPE === 'BooleanInt') {
                                aCustomFieldTriggerDefaultValueChange.push(oMeta);
                            }
                        }


                        if (_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {

                            var oItemMeta = await createItemMetadata(oMeta);
                            var oMasterdataMetaResponse = await createObj(oItemMeta, oPersistency);
                        }
                    } catch (e) {
                        isBatchSuccess = false;
                        await createResponse(oMeta, e, Operation.CREATE, aResultSetCreateFailed);
                    }
                });
            }
            if (sItemKey === 'UPDATE') {
                _.each(aBatchItems, async function (oMeta) {
                    try {
                        var oMetaResponse = {};



                        if (_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {

                            var oItemMeta = await createItemMetadata(oMeta);
                            oMetaResponse = await updateObj(oItemMeta, oPersistency);
                        }

                        oMetaResponse = await updateObj(oMeta, oPersistency);
                        aResultSetUpdateSucess.push(_.omit(oMetaResponse, 'FORMULAS_TRIGGERS_IS_MANUAL_CHANGE'));
                        if (oMetaResponse.IS_CUSTOM === 1) {
                            aCustomFieldTriggerUnitChange.push(oMeta);
                            if (oMetaResponse.UOM_CURRENCY_FLAG === 0 && oMetaResponse.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE.length > 0) {
                                aCustomFieldTriggerManualChange.push(oMeta);
                            }
                        }

                        if (_.includes(aStandardFieldsWithFormulas, oMeta.COLUMN_ID) && oMetaResponse.FORMULAS_TRIGGERS_IS_MANUAL_CHANGE.length > 0) {
                            aStandardFieldTriggerManualChange.push(oMeta);
                        }
                    } catch (e) {
                        isBatchSuccess = false;
                        await createResponse(oMeta, e, Operation.UPDATE, aResultSetUpdateFailed);
                    }
                });
            }
            if (sItemKey === 'DELETE') {
                _.each(aBatchItems, async function (oMeta) {
                    try {


                        if (_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oMeta.BUSINESS_OBJECT)) {

                            var oItemMeta = JSON.parse(JSON.stringify(oMeta));
                            oItemMeta.PATH = 'Item';
                            oItemMeta.BUSINESS_OBJECT = 'Item';

                            await deleteObj(oItemMeta, oPersistency, aBatchItems, checkCanExecute);
                        }

                        var oMetaResponse = await deleteObj(oMeta, oPersistency, aBatchItems, checkCanExecute);
                        aResultSetDeleteSucess.push(oMetaResponse);
                    } catch (e) {
                        isBatchSuccess = false;
                        await createResponse(oMeta, e, Operation.DELETE, aResultSetDeleteFailed);
                    }
                });
            }
        });

        if (isBatchSuccess === true) {
            if (await helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false) {
                aResult.CREATE = aResultSetCreateSuccess;
                aResult.UPDATE = aResultSetUpdateSucess;
                aResult.DELETE = aResultSetDeleteSucess;
            }
        } else {
            aResult = _.union(aResultSetCreateFailed, aResultSetUpdateFailed, aResultSetDeleteFailed);
        }

        oResult.isBatchSuccess = isBatchSuccess;
        oResult.batchResults = aResult;

        if (await helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false) {

            if (isBatchSuccess) {
                try {

                    oPersistency.Metadata.createDeleteAndGenerate();
                } catch (e) {
                    var oMessageDetails = new MessageDetails();
                    _.each(aBodyMeta, function (aBatchItems, sItemKey) {
                        if (sItemKey === 'CREATE') {
                            _.each(aBatchItems, function (oMeta) {
                                oMessageDetails.addMetadataObjs(oMeta);
                            });
                        }
                        if (sItemKey === 'UPDATE') {
                            _.each(aBatchItems, function (oMeta) {
                                oMessageDetails.addMetadataObjs(oMeta);
                            });
                        }
                        if (sItemKey === 'DELETE') {
                            _.each(aBatchItems, function (oMeta) {
                                oMessageDetails.addMetadataObjs(oMeta);
                            });
                        }
                    });

                    const sClientMsg = 'Exception when generating custom fields using DbArtefactController.';
                    const sServerMsg = `${ sClientMsg } \nException: ${ e }`;
                    await logError(sServerMsg);
                    throw new PlcException(Code.GENERAL_GENERATION_EXCEPTION, sClientMsg, oMessageDetails);
                }
            }

            if (isBatchSuccess === true && aCustomFieldTriggerUnitChange.length > 0) {





                oPersistency.Metadata.copyItemsToItemExt();


                const aMasterdataBusinessObjectsToCopy = _.without(_.uniq(_.map(aCustomFieldTriggerUnitChange, 'BUSINESS_OBJECT')), 'Item');
                aMasterdataBusinessObjectsToCopy.forEach((sBusinessObject, index) => {
                    oPersistency.Metadata.copyMasterdataToMasterdataExt(sBusinessObject);
                });

                aCustomFieldTriggerUnitChange.forEach((oMetaTriggerUnitChange, index) => {
                    oPersistency.Metadata.updateUnitField(oMetaTriggerUnitChange);
                });

                _.each(aCustomFieldTriggerManualChange, function (oMetaTriggerManualChange) {
                    if (oMetaTriggerManualChange.PATH === 'Item' && oMetaTriggerManualChange.BUSINESS_OBJECT === 'Item') {
                        oPersistency.Metadata.updateManualField(oMetaTriggerManualChange);
                    }
                });
            }

            if (isBatchSuccess === true && aStandardFieldTriggerManualChange.length > 0) {
                _.each(aStandardFieldTriggerManualChange, function (oMetaStandardField) {
                    if (oMetaStandardField.PATH === 'Item' && oMetaStandardField.BUSINESS_OBJECT === 'Item') {
                        oPersistency.Metadata.updateManualFieldForStandardFields(oMetaStandardField);
                    }
                });
            }

            if (isBatchSuccess === true && aCustomFieldTriggerDefaultValueChange.length > 0) {
                aCustomFieldTriggerDefaultValueChange.forEach((oMetaTriggerBooleanChange, index) => {
                    oPersistency.Metadata.updateFieldWithDefaultValue(oMetaTriggerBooleanChange);
                });
            }


            if (isBatchSuccess === true && aResultSetDeleteSucess.length > 0) {
                oPersistency.Metadata.removeLayoutData();
            }
        }

        return oResult;
    };










    async function generateTableDisplayOrder(aBatchItems, oPersistency) {
        var oRefField = {};
        var iTableDisplayOrder = 0;
        var aFields = _.filter(aBatchItems, function (oMeta) {
            return oMeta.UOM_CURRENCY_FLAG !== 1;
        });

        if (!helpers.isNullOrUndefined(aBatchItems[0])) {
            iTableDisplayOrder = oPersistency.Metadata.getTableDisplayOrder(aBatchItems[0]);
        }

        _.each(aFields, async function (oField) {
            if (_.includes(Constants.aCustomFieldMasterdataBusinessObjects, oField.BUSINESS_OBJECT) && oField.BUSINESS_OBJECT !== 'Work_Center') {

                oField.TABLE_DISPLAY_ORDER = iTableDisplayOrder;
                iTableDisplayOrder++;

                if (!helpers.isNullOrUndefined(oField.REF_UOM_CURRENCY_COLUMN_ID) && oField.REF_UOM_CURRENCY_COLUMN_ID !== '') {

                    oRefField = _.find(aBatchItems, function (oMeta) {
                        return oMeta.PATH === oField.REF_UOM_CURRENCY_PATH && oMeta.BUSINESS_OBJECT === oField.REF_UOM_CURRENCY_BUSINESS_OBJECT && oMeta.COLUMN_ID === oField.REF_UOM_CURRENCY_COLUMN_ID;
                    });
                    oRefField.TABLE_DISPLAY_ORDER = iTableDisplayOrder;
                    iTableDisplayOrder++;
                }
            } else
                oField.TABLE_DISPLAY_ORDER = null;
        });
    }













    async function createItemMetadata(oMeta) {
        var oItemCategory = Constants.ItemCategory;
        var oMetaItem = JSON.parse(JSON.stringify(oMeta));
        oMetaItem.PATH = 'Item';
        oMetaItem.BUSINESS_OBJECT = 'Item';
        oMetaItem.TABLE_DISPLAY_ORDER = null;
        oMetaItem.ATTRIBUTES = oMetaItem.ATTRIBUTES.slice();
        oMetaItem.ATTRIBUTES[0].PATH = 'Item';
        oMetaItem.ATTRIBUTES[0].BUSINESS_OBJECT = 'Item';

        if (oMetaItem.UOM_CURRENCY_FLAG === 0 && !helpers.isNullOrUndefined(oMetaItem.REF_UOM_CURRENCY_COLUMN_ID)) {
            oMetaItem.REF_UOM_CURRENCY_PATH = 'Item';
            oMetaItem.REF_UOM_CURRENCY_BUSINESS_OBJECT = 'Item';
        }

        _.each(oMetaItem.TEXT, function (oText) {
            oText.PATH = 'Item';
        });

        switch (oMeta.BUSINESS_OBJECT) {
        case 'Material':
        case 'Material_Plant':
            oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Material;
            oMetaItem.ATTRIBUTES = _.times(7, function () {
                return _.clone(oMetaItem.ATTRIBUTES[0]);
            });
            oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.CalculationVersion;
            oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Document;
            oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.Material;
            oMetaItem.ATTRIBUTES[3].ITEM_CATEGORY_ID = oItemCategory.ExternalActivity;
            oMetaItem.ATTRIBUTES[4].ITEM_CATEGORY_ID = oItemCategory.Subcontracting;
            oMetaItem.ATTRIBUTES[5].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
            oMetaItem.ATTRIBUTES[6].ITEM_CATEGORY_ID = oItemCategory.ReferencedVersion;
            break;
        case 'Material_Price':
            oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Prices;
            oMetaItem.ATTRIBUTES = _.times(4, function () {
                return _.clone(oMetaItem.ATTRIBUTES[0]);
            });
            oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.Document;
            oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Material;
            oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.ExternalActivity;
            oMetaItem.ATTRIBUTES[3].ITEM_CATEGORY_ID = oItemCategory.Subcontracting;
            break;
        case 'Cost_Center':
            oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Organization;
            oMetaItem.ATTRIBUTES = _.times(2, function () {
                return _.clone(oMetaItem.ATTRIBUTES[0]);
            });
            oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
            oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
            break;
        case 'Work_Center':
            oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Organization;
            oMetaItem.ATTRIBUTES = _.times(3, function () {
                return _.clone(oMetaItem.ATTRIBUTES[0]);
            });
            oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
            oMetaItem.ATTRIBUTES[1].ITEM_CATEGORY_ID = oItemCategory.Process;
            oMetaItem.ATTRIBUTES[2].ITEM_CATEGORY_ID = oItemCategory.VariableItem;
            break;
        case 'Activity_Price':
            oMetaItem.SIDE_PANEL_GROUP_ID = Constants.CustomFieldDisplayGroup.Prices;
            oMetaItem.ATTRIBUTES = _.times(1, function () {
                return _.clone(oMetaItem.ATTRIBUTES[0]);
            });
            oMetaItem.ATTRIBUTES[0].ITEM_CATEGORY_ID = oItemCategory.InternalActivity;
            break;
        default: {
                const sLogMessage = `Custom fields are not maintainable for this masterdata object.`;
                await logError(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
        return oMetaItem;
    }















    async function createObj(oMeta, oPersistency) {
        var oMetaResponse;



        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (bMetaExists) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addMetadataObjs(oMeta);
            const sLogMessage = `An entry for column ${ oMeta.COLUMN_ID } of ${ oMeta.BUSINESS_OBJECT } object with the path ${ oMeta.PATH } already exists in the database.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR, sLogMessage, oMessageDetails);
        }

        oMetaResponse = await oPersistency.Metadata.create(oMeta);
        return oMetaResponse;
    }














    async function updateObj(oMeta, oPersistency) {
        var oMetaResponse;



        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (!bMetaExists) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addMetadataObjs(oMeta);
            const sLogMessage = `There is no entry for column ${ oMeta.COLUMN_ID } of ${ oMeta.BUSINESS_OBJECT } object with the path ${ oMeta.PATH }.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }

        if (!helpers.isNullOrUndefined(oMeta.FORMULAS) && !_.isEmpty(oMeta.FORMULAS)) {
            await checkIsUsedInCostingSheetFormula(oMeta, oPersistency);
            await checkIsUsedAsOverheadCustom(oMeta, oPersistency);
        }

        oMetaResponse = await oPersistency.Metadata.update(oMeta);
        return oMetaResponse;
    }














    async function deleteObj(oMeta, oPersistency, aBatchItems, checkCanExecute) {
        var sPath = oMeta.PATH;
        var sObject = oMeta.BUSINESS_OBJECT;
        var sColumn = oMeta.COLUMN_ID;



        var bMetaExists = oPersistency.Metadata.checkMetadataExists(oMeta);
        if (!bMetaExists) {
            var oMessageDetails = new MessageDetails();
            oMessageDetails.addMetadataObjs(oMeta);
            const sLogMessage = `There is no entry for column ${ sColumn } of ${ sObject } object with the path ${ sPath }.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sLogMessage, oMessageDetails);
        }

        var aIsUsedInFormulas = oPersistency.Metadata.checkIsUsedInFormula(oMeta, aBatchItems);
        if (aIsUsedInFormulas.length > 0) {
            var oMessageDetails = new MessageDetails();
            _.each(aIsUsedInFormulas, function (oIsUsedInFormula) {
                var formulaUsed = {};
                formulaUsed.COLUMN_ID = oIsUsedInFormula.COLUMN_ID;
                formulaUsed.PATH = oIsUsedInFormula.COLUMN_ID;
                formulaUsed.BUSINESS_OBJECT = oIsUsedInFormula.BUSINESS_OBJECT;
                oMessageDetails.addFormulaObjs(formulaUsed);
            });

            const sClientMsg = `Cannot delete field ${ oMeta } since it used in other formulas`;
            const sServerMsg = `${ sClientMsg } Used in formulas: ${ oMessageDetails.formulaObjs }.`;
            await logError(sServerMsg);
            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sClientMsg, oMessageDetails);
        }

        await checkIsUsedInCostingSheetFormula(oMeta, oPersistency);
        await checkIsUsedAsOverheadCustom(oMeta, oPersistency);

        if (await helpers.isNullOrUndefined(checkCanExecute) || checkCanExecute === false) {
            oPersistency.Metadata.remove(oMeta);
        }
        return oMeta;
    }

    async function checkIsUsedInCostingSheetFormula(oMeta, oPersistency) {

        var aIsUsedInCostingSheetFormula = await oPersistency.Metadata.checkIsUsedInCostingSheetFormula(oMeta.COLUMN_ID);
        if (aIsUsedInCostingSheetFormula.length > 0) {

            const sClientMsg = `The field ${ oMeta.COLUMN_ID } is referenced in a costing sheet overhead rule formula.`;
            const sServerMsg = `${ sClientMsg } Costing sheet overhead rules: ${ JSON.stringify(aIsUsedInCostingSheetFormula) }`;
            await logError(sServerMsg);
            throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_FORMULA_ERROR, sClientMsg);
        }
    }

    async function checkIsUsedAsOverheadCustom(oMeta, oPersistency) {

        let aIsUsedAsOverheadCustom = await oPersistency.Metadata.checkIsUsedAsOverheadCustom(oMeta);
        if (aIsUsedAsOverheadCustom.length > 0) {
            if (aIsUsedAsOverheadCustom[0].OVERHEAD_CUSTOM === oMeta.COLUMN_ID) {

                let oMessageDetails = new MessageDetails();
                oMessageDetails.addMetadataObjs(oMeta);
                const sLogMessage = `The field ${ oMeta.COLUMN_ID } is referenced in a costing sheet overhead custom.`;
                await logError(sLogMessage);
                throw new PlcException(Code.CUSTOM_FIELD_REFERENCED_IN_COSTING_SHEET_OVERHEAD_ERROR, sLogMessage, oMessageDetails);
            }
        }
    }















    async function createResponse(oMeta, e, operation, aResultSet) {
        var oResult = {};
        oResult.code = e.code.code;
        oResult.operation = operation;
        oResult.severity = Severity.ERROR;
        if (!helpers.isNullOrUndefined(e.details)) {
            oResult.details = e.details;
            oResult.details.metadataEntity = oMeta;
        } else {
            oResult.details = {};
            oResult.details.metadataEntity = oMeta;
        }

        aResultSet.push(oResult);
    }













    this.getRollupCustomFieldsAsObjectToReset = function (sPath, sBusinessObject, iItemCategory, oPersistency) {
        var oFieldsWithRollup = {};
        var aFieldsWithRollup = oPersistency.Metadata.getRollupCustomFieldsWithoutFormulas(sPath, sBusinessObject, iItemCategory);
        if (aFieldsWithRollup.length > 0) {
            var aColumns = [];
            var aValues = [];
            _.each(aFieldsWithRollup, function (oField) {
                var sIsManualColumn = oField.COLUMN_ID + '_IS_MANUAL';
                aColumns.push(sIsManualColumn);
                aValues.push(1);
            });
            oFieldsWithRollup = _.zipObject(aColumns, aValues);
        }
        return oFieldsWithRollup;
    };
}
MetadataProvider.prototype = await Object.create(MetadataProvider.prototype);
MetadataProvider.prototype.constructor = MetadataProvider;

module.exports.MetadataProvider = MetadataProvider;
export default {_,helpers,Constants,MapStandardFieldsWithFormulas,MessageLibrary,Operation,PlcException,Code,MessageDetails,Severity,oValidItemCustFieldNameRegexp,aFrontendOnlyMetadata,Procedures,logError,MetadataProvider};
