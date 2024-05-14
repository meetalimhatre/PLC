const _ = require('lodash');
const helpers = require('../util/helpers');
const BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;
const MessageLibrary = require('../util/message');
const authorizationUnroller = require('./authorization-unroller');

const PlcException = MessageLibrary.PlcException;
const Message = MessageLibrary.Message;
const Severity = MessageLibrary.Severity;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

const userGroup = 'Group';
const userGroupUser = 'Member';
const userGroupUserGroup = 'Subgroup';

module.exports.Groups = function ($) {

    const sUserId = $.getPlcUsername();

    /**
 * Handles a HTTP GET requests to get the user groups.
 * Get parameters:
 * 	- lock (=true) - locks the Group business object
 *  - id - the id of a group ( when is set it returns the group together with the members and subgroups
 *  - searchAutocomplete - return the groups that start with the string
 *  
 * @param {array}
 *            aBodyItems - An array containing JS objects. (empty for get method)
 * @param {array}
 *            aParameters - List of request parameters.
 * @param {object}
 *            oServiceOutput - Object encapsulating any payload of the response (also status).
 * @param {object}
 *            oPersistency - Instance of Persistency to access data base.
 */
    this.get = async function (aBodyItems, aParameters, oServiceOutput, oPersistency) {
        var aGroups = [];
        var aGroupMembers = {};
        var oLockStatus = {};

        if (_.has(aParameters, 'lock') && (aParameters.lock === true || aParameters.lock === 'true')) {
            oPersistency.Misc.lockTableTLockExclusive();
            //check if another user is editing the user groups
            let aLockObjects = oPersistency.Misc.getLock(BusinessObjectTypes.Group, sUserId);
            if (aLockObjects.length > 0) {
                oLockStatus.USER_ID = aLockObjects[0].USER_ID;
                oLockStatus.IS_LOCKED = 1;
            } else {
                oPersistency.Misc.setLock(BusinessObjectTypes.Group, sUserId);
                oLockStatus.IS_LOCKED = 0;
            }
        }

        if (_.has(aParameters, 'id')) {
            var sGroupId = `'${ aParameters.id }'`;
            aGroups = oPersistency.Group.getGroups([sGroupId]);
            if (aGroups.length === 0) {
                const sClientMsg = `No group exists for this id.`;
                const sServerMsg = `${ sClientMsg } Group id: ${ aParameters.id }.`;
                $.trace.error(sServerMsg);
                throw new PlcException(Code.GENERAL_ENTITY_NOT_FOUND_ERROR, sClientMsg);
            } else {
                aGroupMembers = oPersistency.Group.getGroupMembers(aParameters.id);
            }
        } else if (_.has(aParameters, 'searchAutocomplete')) {
            aGroups = oPersistency.Group.getGroups(null, aParameters.searchAutocomplete);
        } else {
            aGroups = oPersistency.Group.getGroups();
        }

        var oReturnObject = {
            'GROUPS': _.values(aGroups),
            'MEMBERS': _.values(aGroupMembers.USERS),
            'SUBGROUPS': _.values(aGroupMembers.GROUPS),
            'LOCK_STATUS': oLockStatus
        };

        oServiceOutput.setBody(oReturnObject);
        return oServiceOutput;
    };

    /**
 * Handles a HTTP POST request (Batch Operation).
 * The request body contains a section for CREATE, one for UPDATE and one for DELETE.
 * We can edit Groups, and the groups membership (user and other groups).
 * On the response in case of success all the edited group will be returned on the corresponding operation
 * keeping the same structure as the request.
 * On the response in case of errors there will be an array with every group, members and subgroups and operation that 
 * could not be done.
 *
 * @param {object}
 *            oBodyItems - The JS object used for the batch. 
 * @param {array}
 *            aParameters - List of request parameters. (in case of post request no parameters are defined)
 * @param {object}
 *            oServiceOutput - Object encapsulating any payload of the response (also status).
 *            Since nothing is set in the backend, the respones body will be empty.
 * @param {object}
 *            oPersistency - Instance of Persistency to access data base.
 */
    this.edit = async function (oBodyItems, aParameters, oServiceOutput, oPersistency) {
        //check if the Groups are locked
        var aLockObjects = oPersistency.Misc.getLock(BusinessObjectTypes.Group, sUserId, true);
        if (aLockObjects.length === 1 && aLockObjects[0].USER_ID !== sUserId) {
            const sLogMessage = `UserGroups is locked by user ${ aLockObjects[0].USER_ID }`;
            await $.trace.info(sLogMessage);

            var oMessageDetails = new MessageDetails();
            oMessageDetails.addUserObj({ id: aLockObjects[0].USER_ID });
            oServiceOutput.addMessage(await new Message(Code.GROUPS_NOT_WRITABLE_ERROR, Severity.ERROR, oMessageDetails));
        }
        //if the groups are not locked, set lock for current user
        if (aLockObjects.length === 0) {
            oPersistency.Misc.lockTableTLockExclusive();
            oPersistency.Misc.setLock(BusinessObjectTypes.Group, sUserId);
        }

        var aResultErrors = [];
        await createGroupsSubgroupsMembers(oBodyItems, oPersistency, aResultErrors);
        await deleteGroupsSubgroupsMembers(oBodyItems, oPersistency, aResultErrors);


        if (!helpers.isNullOrUndefined(oBodyItems.UPDATE) && !helpers.isNullOrUndefined(oBodyItems.UPDATE.GROUPS) && oBodyItems.UPDATE.GROUPS.length > 0) {
            let aItemsNotUpdatedGroups = oPersistency.Group.updateUsergroups(oBodyItems.UPDATE.GROUPS);
            if (aItemsNotUpdatedGroups.length > 0) {
                _.each(aItemsNotUpdatedGroups, async function (oGroup) {
                    const sLogMessage = `Group ${ oGroup.GROUP_ID } not found to update.`;
                    $.trace.error(sLogMessage);
                    createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.UPDATE, userGroup, { 'GROUP_ID': oGroup.GROUP_ID }, aResultErrors);
                });
            }
        }

        if (aResultErrors.length > 0) {
            oServiceOutput.setStatus($.net.http.BAD_REQUEST);
            _.each(aResultErrors, function (oMsg) {
                oServiceOutput.addMessage(oMsg);
            });
            const sLogMessage = `Errors during existence checks.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.BATCH_OPPERATION_ERROR, sLogMessage);
        }

        return oServiceOutput;
    };












    async function createGroupsSubgroupsMembers(oBodyItems, oPersistency, aResultErrors) {
        if (!helpers.isNullOrUndefined(oBodyItems.CREATE)) {
            if (!helpers.isNullOrUndefined(oBodyItems.CREATE.GROUPS) && oBodyItems.CREATE.GROUPS.length > 0) {
                let aItemsNotCreatedGroups = oPersistency.Group.insertUsergroups(oBodyItems.CREATE.GROUPS);

                if (aItemsNotCreatedGroups.length > 0) {
                    _.each(aItemsNotCreatedGroups, async function (oGroup) {
                        const sServerMsg = `Group ${ oGroup.GROUP_ID } already defined.`;
                        $.trace.error(sServerMsg);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code, MessageLibrary.Operation.CREATE, userGroup, oGroup, aResultErrors);
                    });
                }
            }
            if (!helpers.isNullOrUndefined(oBodyItems.CREATE.MEMBERS) && oBodyItems.CREATE.MEMBERS.length > 0) {
                let aItemsNotCreatedMembers = oPersistency.Group.insertUserMembership(oBodyItems.CREATE.MEMBERS);
                if (aItemsNotCreatedMembers.length > 0) {

                    _.each(aItemsNotCreatedMembers, async function (oMember) {
                        const sServerMsg = `User ${ oMember.USER_ID } already defined.`;
                        $.trace.error(sServerMsg);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code, MessageLibrary.Operation.CREATE, userGroupUser, oMember, aResultErrors);
                    });
                }
            }
            if (!helpers.isNullOrUndefined(oBodyItems.CREATE.SUBGROUPS) && oBodyItems.CREATE.SUBGROUPS.length > 0) {

                let aSubgroups = _.map(oBodyItems.CREATE.SUBGROUPS, function (oItem) {
                    return `'${ oItem.SUBGROUP_ID }'`;
                });
                let aGroups = oPersistency.Group.getGroups(aSubgroups);
                if (aGroups.length !== oBodyItems.CREATE.SUBGROUPS.length) {
                    let aUnexistingGroups = _.difference(aSubgroups, _.map(aGroups, function (oItem) {
                        return `'${ oItem.GROUP_ID }'`;
                    }));
                    _.each(aUnexistingGroups, async function (oSubgroup) {
                        const sServerMsg = `Subgroup ${ oSubgroup.SUBGROUP_ID } not found in the system.`;
                        $.trace.error(sServerMsg);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.CREATE, userGroupUserGroup, { 'SUBGROUP_ID': oSubgroup }, aResultErrors);
                    });
                }

                let aItemsNotCreatedSubgroups = oPersistency.Group.insertGroupMembership(oBodyItems.CREATE.SUBGROUPS);
                if (aItemsNotCreatedSubgroups.length > 0) {

                    _.each(aItemsNotCreatedSubgroups, async function (oSubgroup) {
                        const sServerMsg = `Subgroup ${ oSubgroup.SUBGROUP_ID } already defined.`;
                        $.trace.error(sServerMsg);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_ALREADY_EXISTS_ERROR.code, MessageLibrary.Operation.CREATE, userGroupUserGroup, oSubgroup, aResultErrors);
                    });
                } else {
                    if (authorizationUnroller.containsCycle(await oPersistency.getConnection())) {
                        const sLogMessage = 'Cycle detected.';
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GROUP_CYCLE_ERROR, sLogMessage);
                    }
                }
            }
        }
    }












    async function deleteGroupsSubgroupsMembers(oBodyItems, oPersistency, aResultErrors) {
        if (!helpers.isNullOrUndefined(oBodyItems.DELETE)) {
            if (!helpers.isNullOrUndefined(oBodyItems.DELETE.GROUPS) && oBodyItems.DELETE.GROUPS.length > 0) {

                let aItemsNotDeletedGroups = oPersistency.Group.deleteUsergroups(oBodyItems.DELETE.GROUPS);
                if (aItemsNotDeletedGroups.length > 0) {
                    _.each(aItemsNotDeletedGroups, async function (oGroup) {
                        const sLogMessage = `Group ${ oGroup.GROUP_ID } not found to delete.`;
                        $.trace.error(sLogMessage);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.DELETE, userGroup, oGroup, aResultErrors);
                    });
                }
            }
            if (!helpers.isNullOrUndefined(oBodyItems.DELETE.MEMBERS) && oBodyItems.DELETE.MEMBERS.length > 0) {
                let aItemsNotDeletedMembers = oPersistency.Group.deleteUserMembership(oBodyItems.DELETE.MEMBERS);
                if (aItemsNotDeletedMembers.length > 0) {

                    _.each(aItemsNotDeletedMembers, async function (oMember) {
                        const sLogMessage = `User ${ oMember.USER_ID } not found to delete.`;
                        $.trace.error(sLogMessage);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.DELETE, userGroupUser, oMember, aResultErrors);
                    });
                }
            }
            if (!helpers.isNullOrUndefined(oBodyItems.DELETE.SUBGROUPS) && oBodyItems.DELETE.SUBGROUPS.length > 0) {
                let aItemsNotDeletedMembers = oPersistency.Group.deleteGroupMembership(oBodyItems.DELETE.SUBGROUPS);
                if (aItemsNotDeletedMembers.length > 0) {

                    _.each(aItemsNotDeletedMembers, async function (oSubgroup) {
                        const sLogMessage = `Subgroup ${ oSubgroup.SUBGROUP_ID } not found to delete.`;
                        $.trace.error(sLogMessage);
                        createMultipleErrorsResponse(Code.GENERAL_ENTITY_NOT_FOUND_ERROR.code, MessageLibrary.Operation.DELETE, userGroupUserGroup, oSubgroup, aResultErrors);
                    });
                }
            }
        }
    }

    function createMultipleErrorsResponse(errorMessageCode, operation, sEntityType, oItem, aResultErrors) {
        var oResult = {};
        oResult.code = errorMessageCode;
        oResult.severity = MessageLibrary.Severity.ERROR;
        oResult.operation = operation;
        oResult.details = {};
        oResult.details.groupObject = oItem;
        oResult.details.groupObject.ENTITY_TYPE = sEntityType;
        aResultErrors.push(oResult);
    }

};
export default {_,helpers,BusinessObjectTypes,MessageLibrary,authorizationUnroller,PlcException,Message,Severity,Code,MessageDetails,userGroup,userGroupUser,userGroupUserGroup};
