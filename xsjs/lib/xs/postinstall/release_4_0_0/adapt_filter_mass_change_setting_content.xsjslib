/**
 * After the data model change in t_frontend_settings for Filter and Mass Change the renamings and removal of columns related to t_item and masterdata tables should be considered,
 * same as the renaming of some business objects.
 * Therefor all frontend settings with the type FILTER or MASSCHANGE found in the t_frontend_settings table has to be checked after the data model change
 */
const helpers = $.require('../../util/helpers');
const sFrontendSettingsTable = 'sap.plc.db::basis.t_frontend_settings';

var oConnection = null;
const aRemovedColumns = [
    'FIELD_REFERENCE_ID',
    'TABLE_REFERENCE_ID',
    'CALCULATION_ID',
    'DECIMALS_DISPLAYED',
    'DECIMALS_DISPLAYED',
    'GROSS_WEIGHT',
    'GROSS_WEIGHT_CALCULATED',
    'GROSS_WEIGHT_IS_MANUAL',
    'NET_WEIGHT',
    'NET_WEIGHT_CALCULATED',
    'NET_WEIGHT_IS_MANUAL',
    'VOLUME',
    'VOLUME_CALCULATED',
    'VOLUME_IS_MANUAL',
    'VOLUME_UOM_ID',
    'WEIGHT_UOM_ID',
    'STATUS'
];

const aRenamedColumns = [
    [
        'BUSINESS_PROCESS_ID',
        'PROCESS_ID'
    ],
    [
        'BUSINESS_PROCESS_DESCRIPTION',
        'PROCESS_DESCRIPTION'
    ],
    [
        'CREATED_AT',
        'CREATED_ON'
    ],
    [
        'LAST_MODIFIED_AT',
        'LAST_MODIFIED_ON'
    ],
    [
        'LAST_MODIFIED_BY_USER_ID',
        'LAST_MODIFIED_BY'
    ],
    [
        'CREATED_BY_USER_ID',
        'CREATED_BY'
    ],
    [
        '_CREATED_BY_USER_ID',
        '_CREATED_BY'
    ],
    [
        '_CREATED_BY_USER_ID_FIRST_VERSION',
        '_CREATED_BY_FIRST_VERSION'
    ],
    [
        'IF_AN_AGGREGATE',
        'SUBITEM_STATE'
    ],
    [
        'OVERHEAD_PRICE_UOM_ID',
        'OVERHEAD_PRICE_UNIT_UOM_ID'
    ],
    [
        'LABORATORY_DESIGN_OFFICE_ID',
        'DESIGN_OFFICE_ID'
    ],
    [
        'LABORATORY_DESIGN_OFFICE_DESCRIPTION',
        'DESIGN_OFFICE_DESCRIPTION'
    ],
    [
        'PRICE_APPLIED_SURCHARGE',
        'SURCHARGE'
    ],
    [
        'PRICE_SOURCE_TYPE',
        'PRICE_SOURCE_TYPE_ID'
    ],
    [
        'PRICE_TRANSACTION_CURRENCY_ID',
        'TRANSACTION_CURRENCY_ID'
    ],
    [
        'QUANTITY_DEPENDENCY_MODE',
        'TOTAL_QUANTITY_DEPENDS_ON'
    ],
    [
        'QUANTITY_FOR_ONE_ASSEMBLY',
        'QUANTITY'
    ],
    [
        'QUANTITY_FOR_ONE_ASSEMBLY_UOM_ID',
        'QUANTITY_UOM_ID'
    ],
    [
        'QUANTITY_FOR_ONE_ASSEMBLY_CALCULATED',
        'QUANTITY_CALCULATED'
    ],
    [
        'QUANTITY_FOR_ONE_ASSEMBLY_IS_MANUAL',
        'QUANTITY_IS_MANUAL'
    ],
    [
        'IS_AN_AGGREGATION',
        'HAS_SUBITEMS'
    ],
    [
        'IS_ROLLED_UP',
        'IS_ROLLED_UP_VALUE'
    ],
    [
        'COSTING_LOT_SIZE',
        'LOT_SIZE'
    ],
    [
        'COSTING_LOT_SIZE_CALCULATED',
        'LOT_SIZE_CALCULATED'
    ],
    [
        'COSTING_LOT_SIZE_IS_MANUAL',
        'LOT_SIZE_IS_MANUAL'
    ],
    [
        'MATERIAL_COSTING_LOT_SIZE',
        'MATERIAL_LOT_SIZE'
    ],
    [
        'MATERIAL_COSTING_LOT_SIZE_UOM_ID',
        'MATERIAL_LOT_SIZE_UOM_ID'
    ]
];

const aRenamedBusinessObjects = [
    [
        'Account_Group_Cost_Component',
        'Component_Split_Account_Group'
    ],
    [
        'Business_Process',
        'Process'
    ],
    [
        'Material_Account',
        'Material_Account_Determination'
    ],
    [
        'Laboratory_Design_Office',
        'Design_Office'
    ]
];

const aRenamedPaths = [
    'Account_Group_Cost_Component',
    'Business_Process',
    'Material_Account',
    'Laboratory_Design_Office'
];
const mRenamedColumns = new Map(aRenamedColumns);
const mRenamedBusinessObjects = new Map(aRenamedBusinessObjects);

/**
 * Function that adapts the conditions from the SETTING_CONTENT accordingly with the data model changes
 * The conditions are checked for renamed business objects, renamed columns, removed columns and renamed paths and then adapted.
 * Returns the condition in the adapted state.
 */
function updateFrontendSettings(oCurrentCondition) {
    const oConditionToUpdate = oCurrentCondition;
    if (!helpers.isNullOrUndefined(oConditionToUpdate.FIELD)) {
        oConditionToUpdate.FIELD.BUSINESS_OBJECT = mRenamedBusinessObjects.get(oCurrentCondition.FIELD.BUSINESS_OBJECT) || oCurrentCondition.FIELD.BUSINESS_OBJECT;
        oConditionToUpdate.FIELD.COLUMN_ID = mRenamedColumns.get(oCurrentCondition.FIELD.COLUMN_ID) || oCurrentCondition.FIELD.COLUMN_ID;
        aRenamedPaths.forEach(sRenamedPath => {
            oConditionToUpdate.FIELD.PATH = oCurrentCondition.FIELD.PATH.replace(sRenamedPath.toUpperCase(), mRenamedBusinessObjects.get(sRenamedPath).toUpperCase());
        });
    }
    if (oCurrentCondition.VALUE && oCurrentCondition.VALUE.indexOf('{') >= 0) {
        const oConditionValue = JSON.parse(oCurrentCondition.VALUE);
        Object.keys(oConditionValue).forEach(sKey => {
            if (mRenamedColumns.get(sKey)) {
                oConditionValue[mRenamedColumns.get(sKey)] = oConditionValue[sKey];
                delete oConditionValue[sKey];
            } else if (aRemovedColumns.indexOf(sKey) >= 0) {
                delete oConditionValue[sKey];
            }
        });
        oConditionToUpdate.VALUE = JSON.stringify(oConditionValue);
    }
    return oConditionToUpdate;
}

function replaceFieldsFilterSetting(oSetting) {
    const oUpdatedSettingContent = oSetting;
    if (!helpers.isNullOrUndefined(oSetting.CONDITIONS)) {
        oSetting.CONDITIONS.forEach((oCondition, iIndex) => {
            oUpdatedSettingContent.CONDITIONS[iIndex] = updateFrontendSettings(oCondition);
        });
    }
    return $.util.codec.encodeBase64(JSON.stringify(oUpdatedSettingContent));
}

function replaceFieldsMassChangeSetting(oSetting) {
    const oUpdatedSettingContent = oSetting;
    if (!helpers.isNullOrUndefined(oSetting.FILTER_CONFIGURATION) && !helpers.isNullOrUndefined(oSetting.FILTER_CONFIGURATION.CONDITIONS)) {
        oSetting.FILTER_CONFIGURATION.CONDITIONS.forEach((oCondition, iIndex) => {
            oUpdatedSettingContent.FILTER_CONFIGURATION.CONDITIONS[iIndex] = updateFrontendSettings(oCondition);
        });
    }
    if (!helpers.isNullOrUndefined(oUpdatedSettingContent.CHANGE_CONFIGURATION)) {
        oUpdatedSettingContent.CHANGE_CONFIGURATION = updateFrontendSettings(oSetting.CHANGE_CONFIGURATION);
    }
    return $.util.codec.encodeBase64(JSON.stringify(oUpdatedSettingContent));
}

/**
 * For each setting, this function decodes the SETTING_CONTENT from Base64 then based on the type a check and replace is done
 * If anything has changed for a given entry, it's SETTING_ID and encoded SETTING_CONTENT are inserted into a map that is afterwards returned.
 * @param aDatabaseFrontendSettings - array that contains all frontend settings with the type FILTER or MASSCHANGE found in the t_frontend_settings table
 */
function findFieldsToReplace(aDatabaseFrontendSettings) {
    const mSettingsToUpdate = new Map();
    aDatabaseFrontendSettings.forEach( oSetting => {
        if (!helpers.isNullOrUndefined(oSetting.SETTING_CONTENT)) {
            const oSettingContentDecoded = JSON.parse(helpers.arrayBufferToString($.util.codec.decodeBase64(oSetting.SETTING_CONTENT)));
            const sChangedSettingContentEncoded = oSetting.SETTING_TYPE === 'FILTER' ? replaceFieldsFilterSetting(oSettingContentDecoded) : replaceFieldsMassChangeSetting(oSettingContentDecoded);
            if (sChangedSettingContentEncoded !== oSetting.SETTING_CONTENT) {
                mSettingsToUpdate.set(oSetting.SETTING_ID, sChangedSettingContentEncoded);
            }
        }
    });

    return mSettingsToUpdate;
}

/**
 * Function that generates an update statment for the t_frontend_settings table based on the map with necessary changes
 * The update statement has to modify the value of SETTING_CONTENT based on SETTING_ID
 * Foreach entry in the map, another condition is added to the case
 * @param mSettingsToUpdate - map that contains all the changes that need to be done for the t_frontend_settings table
 *                            this map has as a key SETTING_ID and as a value the modified SETTING_CONTENT encoded in base64
 */
function generateUpdateStatement(sCurrentSchema, mSettingsToUpdate) {
    let sUpdateStatement = `update "${ sCurrentSchema }"."${ sFrontendSettingsTable }" set SETTING_CONTENT = case `;
    mSettingsToUpdate.forEach((sSettingContent, iSettingId) => {
        sUpdateStatement += `when SETTING_ID = ${ iSettingId } then '${ sSettingContent }' `;
    });
    sUpdateStatement += ` end  where SETTING_ID in ('${ Array.from(mSettingsToUpdate.keys()).join("', '") }')`;

    return sUpdateStatement;
}

async function check(oCurrentConnection) {
    try {
        oConnection =await  $.hdb.getConnection({
            'sqlcc': 'xsjs.sqlcc_config',
            'pool': true,
            'treatDateAsUTC': true
        });
        return true;
    } catch (e) {
        throw e;
    }
}
/**
 * Function that selects all the entries in the t_frontend_settings table with the type FILTER or MASSCHANGE
 * These entries are checked and if anything has to be adapted after the data model change (the map of adaptions is not empty), then an update statement is generated and executed
 * This update statement changes the SETTING_CONTENT column based on its SETTING_ID
 */
async function run(oCurrentConnection) {
    // Adaptions for t_frontend_settings
    const sCurrentSchema = await getCurrentSchema(oCurrentConnection);
    const aDatabaseFrontendSettings = Array.from(oCurrentConnection.executeQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT
                                                                                        from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"
                                                                                  where SETTING_TYPE = 'FILTER' or SETTING_TYPE = 'MASSCHANGE'`));
    const mSettingsToUpdate = findFieldsToReplace(aDatabaseFrontendSettings);
    if (mSettingsToUpdate.size > 0) {
        const sUpdateFrontendSettingsStatement = generateUpdateStatement(sCurrentSchema, mSettingsToUpdate);
        oCurrentConnection.executeUpdate(sUpdateFrontendSettingsStatement);
    }
    return true;
}

async function getCurrentSchema(oCurrentConnection) {
    return (await oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`))[0].CURRENT_SCHEMA;
}

async function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        await oConnection.close();
    }
}

async function clean(oCurrentConnection) {
    await closeSqlConnection(oConnection);
    return true;
}
export default {helpers,sFrontendSettingsTable,oConnection,aRemovedColumns,aRenamedColumns,aRenamedBusinessObjects,aRenamedPaths,mRenamedColumns,mRenamedBusinessObjects,updateFrontendSettings,replaceFieldsFilterSetting,replaceFieldsMassChangeSetting,findFieldsToReplace,generateUpdateStatement,check,run,getCurrentSchema,closeSqlConnection,clean};
