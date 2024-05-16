const helpers = $.require('../../util/helpers');
const sFrontendSettingsTable = 'sap.plc.db::basis.t_frontend_settings';
const aItemCategories = $.require('../../util/constants').ItemCategory;

var oConnection = null;

const aRenamedColumns = [[
        'ITEM_CATEGORY_ID',
        'CHILD_ITEM_CATEGORY_ID'
    ]];

const mRenamedColumns = new Map(aRenamedColumns);

const oRenamedColumns = {
    COLUMN_ID: 'CHILD_ITEM_CATEGORY_ID',
    BUSINESS_OBJECT: 'Custom_Item_Categories',
    PATH: 'ITEM.CUSTOM_ITEM_CATEGORIES'
};

function updateFrontendSettings(oCurrentCondition) {
    const oConditionToUpdate = JSON.parse(JSON.stringify(oCurrentCondition));
    if (!helpers.isNullOrUndefined(oConditionToUpdate.FIELD) && !helpers.isNullOrUndefined(oConditionToUpdate.FIELD.COLUMN_ID) && oConditionToUpdate.FIELD.COLUMN_ID === 'ITEM_CATEGORY_ID') {
        oConditionToUpdate.FIELD.COLUMN_ID = oRenamedColumns.COLUMN_ID;
        oConditionToUpdate.FIELD.BUSINESS_OBJECT = oRenamedColumns.BUSINESS_OBJECT;
        oConditionToUpdate.FIELD.PATH = oRenamedColumns.PATH;
        oConditionToUpdate.VALUE = JSON.stringify(aItemCategories[oConditionToUpdate.VALUE]);
    }
    if (oCurrentCondition.VALUE && oCurrentCondition.VALUE.indexOf('{') >= 0) {
        const oConditionValue = JSON.parse(oCurrentCondition.VALUE);
        Object.keys(oConditionValue).forEach(sKey => {
            if (mRenamedColumns.get(sKey)) {
                oConditionValue[mRenamedColumns.get(sKey)] = oConditionValue[sKey];
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
            oUpdatedSettingContent.CONDITIONS[iIndex] =  updateFrontendSettings(oCondition);
        });
    }
    return $.util.codec.encodeBase64(JSON.stringify(oUpdatedSettingContent));
}

function replaceFieldsMassChangeSetting(oSetting) {
    const oUpdatedSettingContent = oSetting;
    if (!helpers.isNullOrUndefined(oSetting.FILTER_CONFIGURATION) && !helpers.isNullOrUndefined(oSetting.FILTER_CONFIGURATION.CONDITIONS)) {
        oSetting.FILTER_CONFIGURATION.CONDITIONS.forEach((oCondition, iIndex) => {
            oUpdatedSettingContent.FILTER_CONFIGURATION.CONDITIONS[iIndex] =  updateFrontendSettings(oCondition);
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
    aDatabaseFrontendSettings.forEach(oSetting => {
        if (!helpers.isNullOrUndefined(oSetting.SETTING_CONTENT)) {
            const oSettingContentDecoded = JSON.parse(helpers.arrayBufferToString($.util.codec.decodeBase64(oSetting.SETTING_CONTENT)));
            const sChangedSettingContentEncoded = oSetting.SETTING_TYPE === 'FILTER' ?  replaceFieldsFilterSetting(oSettingContentDecoded) :  replaceFieldsMassChangeSetting(oSettingContentDecoded);
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
    return true;
}
/**
 * Function that selects all the entries in the t_frontend_settings table with the type FILTER or MASSCHANGE
 * These entries are checked and if anything has to be adapted after the data model change (the map of adaptions is not empty), then an update statement is generated and executed
 * This update statement changes the SETTING_CONTENT column based on its SETTING_ID
 */
async function run(oCurrentConnection) {
    const sCurrentSchema = await getCurrentSchema(oCurrentConnection);
    const aDatabaseFrontendSettings = Array.from(await oCurrentConnection.executeQuery(`select SETTING_ID, SETTING_NAME, SETTING_TYPE, SETTING_CONTENT
                                                                                        from "${ sCurrentSchema }"."${ sFrontendSettingsTable }"
                                                                                  where SETTING_TYPE = 'FILTER' or SETTING_TYPE = 'MASSCHANGE'`));
    const mSettingsToUpdate = findFieldsToReplace(aDatabaseFrontendSettings);
    if (mSettingsToUpdate.size > 0) {
        const sUpdateFrontendSettingsStatement = generateUpdateStatement(sCurrentSchema, mSettingsToUpdate);
        await oCurrentConnection.executeUpdate(sUpdateFrontendSettingsStatement);
    }
    return true;
}

async function getCurrentSchema(oCurrentConnection) {
    return  (await oCurrentConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`))[0].CURRENT_SCHEMA;
}

async function closeSqlConnection(oConnection) {
    if (oConnection.close) {
        oConnection.close();
    }
}

async function clean(oCurrentConnection) {
    await closeSqlConnection(oCurrentConnection);
    return true;
}
export default {helpers,sFrontendSettingsTable,aItemCategories,oConnection,aRenamedColumns,mRenamedColumns,oRenamedColumns,updateFrontendSettings,replaceFieldsFilterSetting,replaceFieldsMassChangeSetting,findFieldsToReplace,generateUpdateStatement,check,run,getCurrentSchema,closeSqlConnection,clean};
