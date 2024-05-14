var _ = require('lodash');
var helpers = require('../util/helpers');

var MessageLibrary = require('../util/message');
var PlcException = MessageLibrary.PlcException;
var Message = MessageLibrary.Message;
var MessageCode = MessageLibrary.Code;
var MessageDetails = MessageLibrary.Details;
var Severity = MessageLibrary.Severity;

/*********************************************************************
 *  Contains methods for manipulating the items used by different services.
 ********************************************************************/


/**
 * Small helper function that encapsulate the call to the persistency logic of the update and a general exception handling
 * 
 * @param {object}
 *            oItemToUpdate - The JS object representation of the entity that shall be updated. Each contained property of this object will
 *            cause an update the table column correspond to this property.
 * @param oPersistency -
 *            Instance of Persistency to access data base.
 * @returns {integer} - The number of modified rows. Should be 1 in any case, since an exception is throws otherwise.
 * @param {boolean}
 *             bUpdateOnlyStandardFields - Update only standard fields (e.g. when prices are reset for parents when an item is deleted)
 * @throws {PlcException} -
 *             In case the the persistency logic modifies more than 1 entity (row).
 */
async function doUpdate(oItemToUpdate, oPersistency, sSessionId, bUpdateOnlyStandardFields, iOldCategoryId, iNewCategoryId) {

    if (helpers.isNullOrUndefined(bUpdateOnlyStandardFields))
        bUpdateOnlyStandardFields = false;

    if (helpers.isNullOrUndefined(iOldCategoryId))
        iOldCategoryId = 0;

    if (helpers.isNullOrUndefined(iNewCategoryId))
        iNewCategoryId = 0;

    var iAffectedRows = await oPersistency.Item.update(oItemToUpdate, sSessionId, bUpdateOnlyStandardFields, iOldCategoryId, iNewCategoryId);
    if (iAffectedRows !== 1) {
        const sClientMsg = 'Update of item failed; expected to have modifcations on 1 db row, but got ${iAffectedRows}.';
        const sServerMsg = `${ sClientMsg } Item ${ oItemToUpdate.ITEM_ID } in calculation version ${ oItemToUpdate.CALCULATION_VERSION_ID } (session id ${ sSessionId }).`;
        await logError(sServerMsg);
        throw new PlcException(MessageCode.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
    }
    return iAffectedRows;
}

function processValueDeterminationMessages(aMessages, oServiceOutput) {
    var aUnknownMessages = [];
    //reduce the maximum number of messages to 10 for increased performance and usability
    if (Array.isArray(aMessages)) {
        aMessages = aMessages.slice(0, 10);
    }
    _.each(aMessages, async function (oMessage) {
        switch (oMessage.MSG_ID) {
        case MessageCode.PRICEDETERMINATION_REQUESTED_PRICESOURCE_SET_INFO.code:
        case MessageCode.PRICEDETERMINATION_PRICESOURCE_CHANGED_INFO.code:
            oServiceOutput.addMessage(await new Message(MessageCode[oMessage.MSG_ID], Severity.INFO, new MessageDetails().setPriceDeterminationObj({ itemId: oMessage.ITEM_ID })));
            break;
        case MessageCode.PRICEDETERMINATION_STANDARDPRICE_NOT_FOUND_WARNING.code:
            oServiceOutput.addMessage(await new Message(MessageCode[oMessage.MSG_ID], Severity.WARNING, new MessageDetails().setPriceDeterminationObj({ itemId: oMessage.ITEM_ID })));
            break;
        case MessageCode.PRICEDETERMINATION_NO_PRICE_FOR_PRICESOURCE_FOUND_WARNING.code:
            oServiceOutput.addMessage(await new Message(MessageCode[oMessage.MSG_ID], Severity.WARNING, new MessageDetails().setPriceDeterminationObj({
                itemId: oMessage.ITEM_ID,
                priceSourceId: oMessage.PRICE_SOURCE_ID
            })));
            break;
        case MessageCode.ACCOUNTDETERMINATION_ACCOUNT_SET_INFO.code:
            oServiceOutput.addMessage(await new Message(MessageCode[oMessage.MSG_ID], Severity.INFO, new MessageDetails().setAccountDeterminationObj({ itemId: oMessage.ITEM_ID })));
            break;
        case MessageCode.DEPENDENTFIELDSDETERMINATION_FIELDS_SET_FOR_CHANGED_MATERIALS_INFO.code:
        case MessageCode.DEPENDENTFIELDSDETERMINATION_PLANTS_SET_FOR_CHANGED_COMPANY_CODES_INFO.code:
        case MessageCode.DEPENDENTFIELDSDETERMINATION_COMPANY_CODES_SET_FOR_CHANGED_PLANTS_INFO.code:
            oServiceOutput.addMessage(await new Message(MessageCode[oMessage.MSG_ID], Severity.INFO, new MessageDetails().setDependentFieldDeterminationObj({ itemId: oMessage.ITEM_ID })));
            break;
        default:
            aUnknownMessages.push(oMessage);
        }
    });
    return aUnknownMessages;
}

async function logError(msg) {
    helpers.logError(msg);
}

module.exports.doUpdate = doUpdate;
module.exports.processValueDeterminationMessages = processValueDeterminationMessages;
export default {_,helpers,MessageLibrary,PlcException,Message,MessageCode,MessageDetails,Severity,doUpdate,processValueDeterminationMessages,logError};
