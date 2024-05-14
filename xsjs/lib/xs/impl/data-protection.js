const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
const Message = MessageLibrary.Message;
const Code = MessageLibrary.Code;
const Severity = MessageLibrary.Severity;
const MessageDetails = MessageLibrary.Details;

module.exports.DataProtection = function ($) {

    /**
 * Handles a HTTP DELETE request to update with a placeholder and the deletion of personal data (user id, customer id, vendor id) for data protection.
 * The request will also update with a placeholder all personal data only for a given project.
 *
 * @param oBodyData      {object}  - object containing the id(s) of entity to be deleed (userId, customerId, vendorId, projectId)
 * @param oParameters    {object}  - not needed here
 * @param oServiceOutput {object}  - instance of ServiceOutput
 * @param oPersistency   {object}  - instance of Persistency
 *
 * @returns oServiceOutput {object} - the response
 */
    this.remove = async function (oBodyData, oParameters, oServiceOutput, oPersistency) {
        const oPersonalDataTypes = oPersistency.DataProtection.oPersonalDataTypes;

        async function findFormulasContainingRefernencesToThisDataSubject(sSubjectId, sSubjectType) {
            const aFormulaIdsReferencingTheDataSubject = oPersistency.DataProtection.findFormulasThatContainPersonalData(sSubjectId, sSubjectType);
            if (aFormulaIdsReferencingTheDataSubject.length > 0) {
                const oMessageDetails = new MessageDetails();
                oMessageDetails.setMessageText('Some formulas use personal data. Deleting this data may have affected your calculation results.');
                oServiceOutput.addMessage(await new Message(Code.PERSONAL_DATA_IN_FORMULA, Severity.INFO, oMessageDetails));
            }
        }

        async function handleDeleteVendorRequest() {
            if (!helpers.isNullOrUndefined(oBodyData.VENDOR_ID)) {
                const sVendorId = oBodyData.VENDOR_ID.toUpperCase();
                oPersistency.DataProtection.deleteVendorId(sVendorId);
                await findFormulasContainingRefernencesToThisDataSubject(sVendorId, oPersonalDataTypes.Vendor);
            }
        }

        async function handleDeleteCustomerRequest() {
            if (!helpers.isNullOrUndefined(oBodyData.CUSTOMER_ID)) {
                const sCustomerId = oBodyData.CUSTOMER_ID.toUpperCase();
                oPersistency.DataProtection.deleteCustomerId(sCustomerId);
                await findFormulasContainingRefernencesToThisDataSubject(sCustomerId, oPersonalDataTypes.Customer);
            }
        }

        async function handleDeletePersonalDataFromProjectRequest() {
            if (!helpers.isNullOrUndefined(oBodyData.PROJECT_ID)) {
                const sProjectId = oBodyData.PROJECT_ID.toUpperCase();
                oPersistency.DataProtection.removePersonalDataFromProject(sProjectId);
            }
        }

        async function handleDeleteUserIdRequest() {
            async function deleteUserIdFromGroupsAndProjects(sUserId) {
                oPersistency.DataProtection.deleteInstanceBasedUserIds(sUserId);
                oPersistency.DataProtection.deleteUserIds(sUserId);
                await findFormulasContainingRefernencesToThisDataSubject(sUserId, oPersonalDataTypes.User);
            }

            if (!helpers.isNullOrUndefined(oBodyData.USER_ID)) {
                const sUserId = oBodyData.USER_ID.toUpperCase();
                oPersistency.DataProtection.removeReferencesToUserIds(sUserId);
                await deleteUserIdFromGroupsAndProjects(sUserId);
            }
        }

        await handleDeleteUserIdRequest();
        await handleDeleteCustomerRequest();
        await handleDeleteVendorRequest();
        await handleDeletePersonalDataFromProjectRequest();
    };

    /**
 * Handles a HTTP POST request to retrieve all personal data for a requested entity.
 *
 * @param oBodyData      {object}  - contains the requested entity (userId, deleteUser, customerId, vendorId, projectId)
 * @param oParameters    {object}  - not needed here
 * @param oServiceOutput {object}  - instance of ServiceOutput
 * @param oPersistency   {object}  - instance of Persistency
 *
 * @returns oServiceOutput {object} - response containing: table name, column name, entity and counter for the given entity
 */
    this.post = function (oBodyData, oParameters, oServiceOutput, oPersistency) {
        const sEntityID = oBodyData.ENTITY.toUpperCase();
        const sEntityType = oBodyData.ENTITY_TYPE.toUpperCase();
        var oResponseBody = {
            'occurrences': oPersistency.DataProtection.getPersonalData(sEntityID, sEntityType),
            'retention': oPersistency.DataProtection.getRetentionData(sEntityID, sEntityType)
        };
        oServiceOutput.setBody(oResponseBody);
    };

};
export default {helpers,MessageLibrary,Message,Code,Severity,MessageDetails};
