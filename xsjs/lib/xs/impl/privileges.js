const _ = require('lodash');
const helpers = require('../util/helpers');
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;

const MessageLibrary = require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;


module.exports.Privileges = function ($) {

    var sUserId = $.getPlcUsername();

    /**
 * Handles a HTTP GET requests to get privileges.
 *
 */
    this.get = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var aUserPrivileges;
        var aGroupPrivileges;

        //get privileges for entity id(for now project, later other business objects)
        switch (aParameters.entity_type) {
        case BusinessObjectTypes.Project:
            aUserPrivileges = oPersistency.Privilege.getUserPrivileges(BusinessObjectTypes.Project, aParameters.entity_id, sUserId);
            aGroupPrivileges = oPersistency.Privilege.getGroupPrivileges(BusinessObjectTypes.Project, aParameters.entity_id);
            break;
        default: {
                const sLogMessage = `Reading instance based privileges failed. Entity type ${ aParameters.entity_type } is not supported.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        var oProjectPrivileges = {
            'ENTITY_TYPE': aParameters.entity_type,
            'ENTITY_ID': aParameters.entity_id,
            'USER_PRIVILEGES': _.values(aUserPrivileges),
            'GROUP_PRIVILEGES': _.values(aGroupPrivileges)
        };

        oServiceOutput.setBody(oProjectPrivileges);
        return oServiceOutput;
    };

    /**
 * Handles a HTTP POST request (Batch Operation).
 * The request body contains a section for CREATE, one for UPDATE and one for DELETE.
 * We can edit User Privileges, later Group Privileges.
 * On the response in case of success all the edited privileges will be returned on the corresponding operation
 * keeping the same structure as the request.
 * On the response in case of errors there will be an array with every privilege and operation that 
 * could not be done.
 *
 */
    this.edit = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {

        //check if project is opened for editing by the user - only one user can edit the project at a time
        if (oBodyItems.ENTITY_TYPE === BusinessObjectTypes.Project && !oPersistency.Project.isOpenedInSession(oBodyItems.ENTITY_ID, sUserId, true)) {
            const sLogMessage = `Project ${ oBodyItems.ENTITY_ID } is not opened in edit mode.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.PROJECT_NOT_WRITABLE_ERROR, sLogMessage);
        }

        var aResultErrors = [];

        await createPrivileges(oBodyItems, oPersistency, aResultErrors);
        await deletePrivileges(oBodyItems, oPersistency, aResultErrors);
        await updatePrivileges(oBodyItems, oPersistency, aResultErrors);

        if (aResultErrors.length > 0) {
            oServiceOutput.setStatus($.net.http.BAD_REQUEST);
            _.each(aResultErrors, function (oMsg) {
                oServiceOutput.addMessage(oMsg);
            });
            const sLogMessage = `Errors during privilege existence checks.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
        }

        return oServiceOutput;
    };

    async function createPrivileges(oBodyItems, oPersistency, aResultErrors) {
        if (!helpers.isNullOrUndefined(oBodyItems.CREATE)) {
            //create user privileges
            if (!helpers.isNullOrUndefined(oBodyItems.CREATE.USER_PRIVILEGES) && oBodyItems.CREATE.USER_PRIVILEGES.length > 0) {
                const aItemsNotCreated = oPersistency.Privilege.insertUserPrivileges(oBodyItems.CREATE.USER_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                //if there were user privileges that were not created throw error for each object
                if (aItemsNotCreated.length > 0) {
                    _.each(aItemsNotCreated, async function (oPrivilege) {
                        const sLogMessage = `User ${ oPrivilege.USER_ID } has already defined privilege.`;
                        $.trace.error(sLogMessage);
                        await createMultipleErrorsResponse(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code, MessageLibrary.Operation.CREATE, oPrivilege, aResultErrors);
                    });
                }
            }
            //create group privileges
            if (!helpers.isNullOrUndefined(oBodyItems.CREATE.GROUP_PRIVILEGES) && oBodyItems.CREATE.GROUP_PRIVILEGES.length > 0) {
                const aItemsNotCreated = oPersistency.Privilege.insertGroupPrivileges(oBodyItems.CREATE.GROUP_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                //if some group privileges were not created throw proper error for each object
                if (aItemsNotCreated.length > 0) {
                    _.each(aItemsNotCreated, async function (oPrivilege) {
                        if (oPrivilege.ERROR === 'notUnique') {
                            const sLogMessage = `Group ${ oPrivilege.GROUP_ID } has already a privilege defined.`;
                            $.trace.error(sLogMessage);
                            await createMultipleErrorsResponse(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code, MessageLibrary.Operation.CREATE, oPrivilege, aResultErrors);
                        } else {
                            const sLogMessage = `Group ${ oPrivilege.GROUP_ID } does not exit in the system.`;
                            $.trace.error(sLogMessage);
                            await createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.CREATE, oPrivilege, aResultErrors);
                        }
                    });
                }
            }
        }
    }

    async function deletePrivileges(oBodyItems, oPersistency, aResultErrors) {
        if (!helpers.isNullOrUndefined(oBodyItems.DELETE)) {
            //delete user privileges
            if (!helpers.isNullOrUndefined(oBodyItems.DELETE.USER_PRIVILEGES) && oBodyItems.DELETE.USER_PRIVILEGES.length > 0) {
                const aItemsNotDeleted = oPersistency.Privilege.deleteUserPrivileges(oBodyItems.DELETE.USER_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                if (aItemsNotDeleted.length > 0) {
                    _.each(aItemsNotDeleted, async function (oPrivilege) {
                        const sLogMessage = `Could not find defined privilege for user ${ oPrivilege.USER_ID } to delete.`;
                        $.trace.error(sLogMessage);
                        await createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.DELETE, oPrivilege, aResultErrors);
                    });
                } else {
                    //check to see if there is at least one user left that has the ADMINISTRATION privilege for the project
                    if (!oPersistency.Privilege.adminstratorExists(oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID)) {
                        const sLogMessage = `Deleting the users from the request will leave the project without an administrator.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.PROJECT_WITH_NO_ADMINISTRATOR_ERROR, sLogMessage);
                    }
                }
            }
            //delete group privileges
            if (!helpers.isNullOrUndefined(oBodyItems.DELETE.GROUP_PRIVILEGES) && oBodyItems.DELETE.GROUP_PRIVILEGES.length > 0) {
                const aItemsNotDeleted = oPersistency.Privilege.deleteGroupPrivileges(oBodyItems.DELETE.GROUP_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                if (aItemsNotDeleted.length > 0) {
                    _.each(aItemsNotDeleted, async function (oPrivilege) {
                        const sLogMessage = `Could not find defined privilege for group ${ oPrivilege.GROUP_ID } to delete.`;
                        $.trace.error(sLogMessage);
                        await createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.DELETE, oPrivilege, aResultErrors);
                    });
                }
            }
        }
    }

    async function updatePrivileges(oBodyItems, oPersistency, aResultErrors) {
        if (!helpers.isNullOrUndefined(oBodyItems.UPDATE)) {
            //update user privileges
            if (!helpers.isNullOrUndefined(oBodyItems.UPDATE.USER_PRIVILEGES) && oBodyItems.UPDATE.USER_PRIVILEGES.length > 0) {
                const aItemsNotUpdated = oPersistency.Privilege.updateUserPrivileges(oBodyItems.UPDATE.USER_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                if (aItemsNotUpdated.length > 0) {
                    _.each(aItemsNotUpdated, async function (oPrivilege) {
                        const sLogMessage = `Could not find defined privilege for user ${ oPrivilege.USER_ID } to update.`;
                        $.trace.error(sLogMessage);
                        await createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.UPDATE, oPrivilege, aResultErrors);
                    });
                } else {
                    //check to see if there is at least one user left that has the ADMINISTRATION privilege for the project
                    if (!oPersistency.Privilege.adminstratorExists(oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID)) {
                        const sLogMessage = `Deleting the users from the request will leave the project without an administrator.`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.PROJECT_WITH_NO_ADMINISTRATOR_ERROR, sLogMessage);
                    }
                }
            }
            //update group privileges
            if (!helpers.isNullOrUndefined(oBodyItems.UPDATE.GROUP_PRIVILEGES) && oBodyItems.UPDATE.GROUP_PRIVILEGES.length > 0) {
                const aItemsNotUpdated = oPersistency.Privilege.updateGroupPrivileges(oBodyItems.UPDATE.GROUP_PRIVILEGES, oBodyItems.ENTITY_TYPE, oBodyItems.ENTITY_ID);
                if (aItemsNotUpdated.length > 0) {
                    _.each(aItemsNotUpdated, async function (oPrivilege) {
                        const sLogMessage = `Could not find defined privilege for group ${ oPrivilege.GROUP_ID } to update.`;
                        $.trace.error(sLogMessage);
                        await createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.UPDATE, oPrivilege, aResultErrors);
                    });
                }
            }
        }
    }

    function createMultipleErrorsResponse(errorMessageCode, operation, oPrivilege, aResultErrors) {
        var oResult = {};
        oResult.code = errorMessageCode;
        oResult.severity = MessageLibrary.Severity.ERROR;
        oResult.operation = operation;
        oResult.details = {};
        oResult.details.privilegeObject = oPrivilege;
        aResultErrors.push(oResult);
    }

};
export default {_,helpers,BusinessObjectTypes,MessageLibrary,PlcException,Code};
