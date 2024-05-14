const _ = $.require('lodash');
const authorizationUnroller = $.require('../authorization/authorization-unroller');
const authorizationManager = $.require('../authorization/authorization-manager');

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const MessageDetails = MessageLibrary.Details;

const Tables = Object.freeze({
    formula: 'sap.plc.db::basis.t_formula',
    auth_project: 'sap.plc.db::auth.t_auth_project',
    auth_user: 'sap.plc.db::auth.t_auth_user',
    usergroup_user: 'sap.plc.db::auth.t_usergroup_user',
    default_settings: 'sap.plc.db::basis.t_default_settings',
    layout_personal: 'sap.plc.db::basis.t_layout_personal',
    lock: 'sap.plc.db::basis.t_lock',
    log: 'sap.plc.db::basis.t_installation_log',
    recent_calculation_versions: 'sap.plc.db::basis.t_recent_calculation_versions',
    calculation_version: 'sap.plc.db::basis.t_calculation_version',
    project: 'sap.plc.db::basis.t_project',
    customer: 'sap.plc.db::basis.t_customer',
    activity_price: 'sap.plc.db::basis.t_activity_price',
    activity_price_ext: 'sap.plc.db::basis.t_activity_price_ext',
    item: 'sap.plc.db::basis.t_item',
    material_price: 'sap.plc.db::basis.t_material_price',
    material_price_ext: 'sap.plc.db::basis.t_material_price_ext',
    vendor: 'sap.plc.db::basis.t_vendor',
    calculation: 'sap.plc.db::basis.t_calculation',
    frontend_settings: 'sap.plc.db::basis.t_frontend_settings',
    personal_data_validity: 'sap.plc.db::basis.t_personal_data_validity',
    variant: 'sap.plc.db::basis.t_variant',
    variant_temporary: 'sap.plc.db::basis.t_variant_temporary',
    auto_complete_user: 'sap.plc.db::basis.t_auto_complete_user',
    entity_tags: 'sap.plc.db::basis.t_entity_tags',
    one_time_project_cost: 'sap.plc.db::basis.t_one_time_project_cost',
    one_time_product_cost: 'sap.plc.db::basis.t_one_time_product_cost',
    project_total_quantities: 'sap.plc.db::basis.t_project_total_quantities',
    project_lifecycle_configuration: 'sap.plc.db::basis.t_project_lifecycle_configuration',
    project_lifecycle_period_type: 'sap.plc.db::basis.t_project_lifecycle_period_type',
    project_monthly_lifecycle_period: 'sap.plc.db::basis.t_project_monthly_lifecycle_period',
    project_lifecycle_period_quantity_value: 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value',
    customer_replication: 'sap.plc.db::repl_st.t_kna1',
    vendor_replication: 'sap.plc.db::repl_st.t_lfa1',
    task: 'sap.plc.db::basis.t_task'
});

const Procedures = Object.freeze({ data_protection_update: 'sap.plc.db.management.procedures::p_data_protection_update_user_ids' });

const Views = Object.freeze({ data_protection_display_info: 'sap.plc.db.views::V_DATA_PROTECTION_DISPLAY_INFO' });

function DataProtection(dbConnection) {
    this.sPlaceholder = 'DELETED';
    this.oPersonalDataTypes = {
        Vendor: 'Vendor',
        Customer: 'Customer',
        User: 'User'
    };

    /**
    * Function to update user ids with 'DELETED' as placeholder
    *
    * @param sUserId {string} - user id to replace with the placeholder "DELETED"
    *
    * @throws {PlcException} - if the call of update procedure fails
    *
    */
    this.removeReferencesToUserIds = async function (sUserId) {
        const procedure = dbConnection.loadProcedure(Procedures.data_protection_update);
        var oResult = await procedure(sUserId);
        return oResult.OV_AFFECTED_ROWS;
    };

    this.deleteInstanceBasedUserIds = async function (sUserId, bJobAutomation) {
        async function checkIfUserIsTheOnlyAdministratorOfProjects() {
            const administratePrivilege = authorizationManager.Privileges.ADMINISTRATE;
            let aResultUserIds = [];
            const sStmtSelect = `select a.object_type, a.object_id, a.user_id from "${ Tables.auth_user }" as a
                                join "${ Tables.auth_user }" as b
                                on a.object_type = b.object_type and a.object_id = b.object_id
                                where a.privilege = ? and b.privilege = ? and a.user_id = ?
                                group by  a.object_type, a.object_id, a.user_id, a.privilege
                                HAVING count(*) = 1;`;
            const result = await dbConnection.executeQuery(sStmtSelect, administratePrivilege, administratePrivilege, sUserId);
            aResultUserIds = _.values(result);
            if (aResultUserIds.length != 0) {
                const sLogMessage = 'The user is the only administrator for at least one project and cannot be deleted. Another administrator needs to be added in order to delete this user.';
                $.trace.error(sLogMessage);
                throw new PlcException(Code.PROJECT_WITH_NO_ADMINISTRATOR_ERROR, sLogMessage);
            }
            return aResultUserIds;
        }

        if (!bJobAutomation) {
            await checkIfUserIsTheOnlyAdministratorOfProjects();
        }

        const sStmtDeleteUserFromAuthTable = `delete from "${ Tables.auth_user }" where user_id = ?;`;
        return await dbConnection.executeUpdate(sStmtDeleteUserFromAuthTable, sUserId);
    };

    /**
    * Function to delete user from PLC Tables (User Group, Layout, Default Settings, Lock, Log, Recent Calculation Versions)
    * and to unroll user's privileges for a Project after instance based privileges have been removed in function deleteInstanceBasedUserIds
    *
    * @param sUserId {string} - user id to be deleted
    *
    * @throws {PlcException} - if the query executions fail
    */
    this.deleteUserIds = async function (sUserId) {
        async function removeUserFromPLCTables() {
            async function createDeleteStatement(sTable) {
                return `delete from "${ sTable }" where user_id = ?; `;
            }

            await dbConnection.executeUpdate(createDeleteStatement(Tables.usergroup_user), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.layout_personal), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.default_settings), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.lock), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.recent_calculation_versions), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.frontend_settings), sUserId);
            await dbConnection.executeUpdate(createDeleteStatement(Tables.auto_complete_user), sUserId);

            const sDeleteUserFromLogTableStmt = `
                delete from "${ Tables.log }"
                where executed_by = ?; `;
            await dbConnection.executeUpdate(sDeleteUserFromLogTableStmt, sUserId);

            const sDeleteUserFromTaskStmt = `
                delete from "${ Tables.task }"
                where session_id = ?; `;
            await dbConnection.executeUpdate(sDeleteUserFromTaskStmt, sUserId);
        }

        async function findProjectsTheUserHasPrivilegesFor() {
            const sStmtSelect = `
                    select project_id
                    from "${ Tables.auth_project }"
                    where user_id = ?`;
            const result = await dbConnection.executeQuery(sStmtSelect, sUserId);
            const aResultProjects = _.values(result);
            return aResultProjects;
        }

        async function unrollPrivilegesAfterUserDeletion() {
            const aResultProjects = await findProjectsTheUserHasPrivilegesFor(sUserId);
            _.each(aResultProjects, oProject => {
                await authorizationUnroller.unrollPrivilegesOnObjectUpdate(dbConnection, 'PROJECT', oProject.PROJECT_ID);
            });
        }

        await removeUserFromPLCTables(sUserId);
        await unrollPrivilegesAfterUserDeletion(sUserId);
    };

    /**
	 * Function to replace customer id with placeholder and delete customer from t_customer
	 *
	 * @param sCustomerId {string} - customer id to be deleted
	 *
	 * @throws {PlcException} - if the query executions fail
	 *
	 * @returns {number} - Number of affected rows
	 */
    this.deleteCustomerId = async function (sCustomerId) {
        let iAffectedRows = 0;

        const sStmtCalculationVersion = `
            update "${ Tables.calculation_version }"
            set customer_id = ?
            where customer_id = ?;`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtCalculationVersion, this.sPlaceholder, sCustomerId);

        const sStmtProject = `
            update "${ Tables.project }"
            set customer_id = ?
            where customer_id = ?;`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtProject, this.sPlaceholder, sCustomerId);

        const sStmtActivityPriceExt = `
                delete from "${ Tables.activity_price_ext }"
                where PRICE_ID in (
                    select PRICE_ID from "${ Tables.activity_price }"
                    where CUSTOMER_ID = ?
                );`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtActivityPriceExt, sCustomerId);

        const sStmtMaterialPriceExt = `
                delete from "${ Tables.material_price_ext }"
                where PRICE_ID in (
                    select PRICE_ID from "${ Tables.material_price }"
                    where CUSTOMER_ID = ?
                );`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtMaterialPriceExt, sCustomerId);

        const aTablesToModify = [
            Tables.activity_price,
            Tables.material_price,
            Tables.customer
        ];

        aTablesToModify.forEach(sTable => {
            const sStmt = `
                delete from "${ sTable }"
                where customer_id = ?;`;
            iAffectedRows += await dbConnection.executeUpdate(sStmt, sCustomerId);
        });

        const sStmtCustomerRepl = `delete from "${ Tables.customer_replication }" where KUNNR = ?;`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtCustomerRepl, sCustomerId);

        return iAffectedRows;
    };

    /**
	 * Function to replace vendor id with placeholder and delete vendor from t_vendor
	 *
	 * @param sVendorId {string} - vendor id to be deleted
	 *
	 * @throws {PlcException} - if the query executions fail
	 *
	 * @returns {number} - Number of affected rows
	 */
    this.deleteVendorId = async function (sVendorId) {

        function deleteVendorStatement(sTable) {
            return `delete from "${ sTable }" where vendor_id = ?`;
        }

        let iAffectedRows = 0;

        var sStmtItem = `
            update "${ Tables.item }"
            set vendor_id = ?
            where vendor_id = ?;`;

        const sDeleteFromMaterialExt = `delete from "${ Tables.material_price_ext }"
                                        where PRICE_ID in (
                                            select PRICE_ID from "${ Tables.material_price }"
                                            where VENDOR_ID = ?
                                        );`;
        iAffectedRows += dbConnection.executeUpdate(sStmtItem, this.sPlaceholder, sVendorId);
        iAffectedRows += dbConnection.executeUpdate(deleteVendorStatement(Tables.vendor), sVendorId);
        iAffectedRows += dbConnection.executeUpdate(sDeleteFromMaterialExt, sVendorId);
        iAffectedRows += dbConnection.executeUpdate(deleteVendorStatement(Tables.material_price), sVendorId);

        var sStmtVendorRepl = `delete from "${ Tables.vendor_replication }" where LIFNR = ?;`;
        iAffectedRows += dbConnection.executeUpdate(sStmtVendorRepl, sVendorId);

        return iAffectedRows;
    };

    /**
	 * Function to replace user id, customer id and vendor id with placeholder for a project
	 *
	 * @param sProjectId {string} - id of project for which personal data will be deleted
	 *
	 * @throws {PlcException} - if the query executions fail
	 *
	 * @returns {number} - Number of affected rows
	 */
    this.removePersonalDataFromProject = async function (sProjectId) {
        let iAffectedRows = 0;

        const sStmtSelectCalculations = `select calculation_id  from "${ Tables.calculation }" where project_id = ?`;

        const sStmtSelectCalculationVersions = `select calculation_version_id from "${ Tables.calculation_version }" where calculation_id in (
            ${ sStmtSelectCalculations })`;

        const sStmtSelectVariants = `select variant_id from "${ Tables.variant }" where calculation_version_id in (${ sStmtSelectCalculationVersions })`;

        const sStmtUpdateVariants = `update "${ Tables.variant }"
            set last_calculated_by = ?,
                last_modified_by = ?,
                last_removed_markings_by = ?
            where variant_id in (
            ${ sStmtSelectVariants })`;
        iAffectedRows = await dbConnection.executeUpdate(sStmtUpdateVariants, this.sPlaceholder, this.sPlaceholder, this.sPlaceholder, sProjectId);

        const sStmtSelectTempVariants = `select variant_id from "${ Tables.variant_temporary }" where calculation_version_id in (${ sStmtSelectCalculationVersions })`;

        const sStmtUpdateTempVariants = `update "${ Tables.variant_temporary }"
                    set last_calculated_by = ?,
                        last_modified_by = ?,
                        last_removed_markings_by = ?
                    where variant_id in (
                    ${ sStmtSelectTempVariants })`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateTempVariants, this.sPlaceholder, this.sPlaceholder, this.sPlaceholder, sProjectId);

        const sStmtUpdateEntityTags = `update "${ Tables.entity_tags }"
                            set created_by = ?
                            where (entity_id in (${ sStmtSelectCalculations }) and ENTITY_TYPE = 'C')
                            OR (entity_id in (${ sStmtSelectCalculationVersions }) AND ENTITY_TYPE = 'V')`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateEntityTags, this.sPlaceholder, sProjectId, sProjectId);


        const sStmtUpdateItems = `update "${ Tables.item }"
            set vendor_id = ?,
                created_by = ?,
                last_modified_by = ?
            where calculation_version_id in (
            ${ sStmtSelectCalculationVersions })`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateItems, this.sPlaceholder, this.sPlaceholder, this.sPlaceholder, sProjectId);

        const sStmtUpdateCalculationVersions = `update "${ Tables.calculation_version }"
            set customer_id = ?,
                last_modified_by = ?
            where calculation_id in (
            ${ sStmtSelectCalculations })`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateCalculationVersions, this.sPlaceholder, this.sPlaceholder, sProjectId);

        const sStmtUpdateCalculations = `update "${ Tables.calculation }"
            set created_by = ?,
                last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateCalculations, this.sPlaceholder, this.sPlaceholder, sProjectId);

        const sStmtUpdateProject = `update "${ Tables.project }"
            set customer_id = ?,
                project_responsible = ?,
                created_by = ?,
                last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProject, this.sPlaceholder, this.sPlaceholder, this.sPlaceholder, this.sPlaceholder, sProjectId);

        // Delete from t_material_price_ext since t_material_price contains PROJECT_ID
        const sStmtDeleteMaterialPriceExt = `delete from "${ Tables.material_price_ext }"
                                    where PRICE_ID in (
                                        select PRICE_ID from "${ Tables.material_price }"
                                        where PROJECT_ID = ?
                                    );`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtDeleteMaterialPriceExt, sProjectId);
        // Table t_material_price contains PROJECT_ID
        const sStmtDeletePrice = `
            delete from "${ Tables.material_price }"
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtDeletePrice, sProjectId);

        const sStmtUpdateOneTimeProjectCost = `update "${ Tables.one_time_project_cost }"
            set last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateOneTimeProjectCost, this.sPlaceholder, sProjectId);

        const sStmtUpdateOneTimeProductCost = `update "${ Tables.one_time_product_cost }"
            set last_modified_by = ?
            where calculation_id in (${ sStmtSelectCalculations })`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateOneTimeProductCost, this.sPlaceholder, sProjectId);

        const sStmtUpdateProjectLifecycleConfig = `update "${ Tables.project_lifecycle_configuration }"
            set last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProjectLifecycleConfig, this.sPlaceholder, sProjectId);

        const sStmtUpdateProjectLifecyclePeriodType = `update "${ Tables.project_lifecycle_period_type }"
            set last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProjectLifecyclePeriodType, this.sPlaceholder, sProjectId);

        const sStmtUpdateProjectMonthlyLifecyclePeriod = `update "${ Tables.project_monthly_lifecycle_period }"
            set last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProjectMonthlyLifecyclePeriod, this.sPlaceholder, sProjectId);

        const sStmtUpdateProjectLifecyclePeriodQuatityValue = `update "${ Tables.project_lifecycle_period_quantity_value }"
            set last_modified_by = ?
            where project_id = ?`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProjectLifecyclePeriodQuatityValue, this.sPlaceholder, sProjectId);

        const sStmtUpdateProjectTotalQuantites = `update "${ Tables.project_total_quantities }"
            set last_modified_by = ?
            where calculation_id in (
            ${ sStmtSelectCalculations })`;
        iAffectedRows += await dbConnection.executeUpdate(sStmtUpdateProjectTotalQuantites, this.sPlaceholder, sProjectId);

        return iAffectedRows;
    };

    /**
	 * Function to check if there are any formulas which contain personal data
	 *
	 * @param sParam {string} - contains personal data (user id, customer id or vendor id)
	 *
	 * @param sType {string} - specifies the type of personal data (User, Customer, Vendor)
	 *
	 * @throws {PlcException} - if the query executions fail
	 *
	 * @returns {array} - Array with IDs of formulas containing personal data
	 */
    this.findFormulasThatContainPersonalData = function (sParam, sType) {
        const sStmtSelect = `select formula_id, count(*) as ROWCOUNT from "${ Tables.formula }" where upper(formula_string) LIKE to_nvarchar(?) or 
                            upper(formula_string) LIKE to_nvarchar(?) or upper(formula_string) LIKE to_nvarchar(?) or 
                            upper(formula_string) LIKE to_nvarchar(?) or upper(formula_string) LIKE to_nvarchar(?) group by formula_id`;
        const aSearchParam = [
            `%'${ sParam }'%`,
            '%CREATED_BY%',
            '%LAST_MODIFIED_BY%',
            '%CUSTOMER_ID%',
            '%VENDOR_ID%'
        ];
        const oResultSet = dbConnection.executeQuery(sStmtSelect, aSearchParam);
        return _.map(oResultSet, oRow => oRow.FORMULA_ID);
    };

    /**
	 * Function to trigger deletion actions if validity data is reached
	 */
    this.erasePersonalDataAfterEndOfValidity = async function () {
        const sStmtSelect = `select * from "${ Tables.personal_data_validity }" where subject <> '*' and VALID_TO < CURRENT_UTCTIMESTAMP`;
        const oResultSet = await dbConnection.executeQuery(sStmtSelect);

        _.each(oResultSet, oResult => {
            switch (oResult.ENTITY.toLowerCase()) {
            case 'user':
                this.removeReferencesToUserIds(oResult.SUBJECT);
                this.deleteInstanceBasedUserIds(oResult.SUBJECT, true);
                this.deleteUserIds(oResult.SUBJECT);
                break;
            case 'vendor':
                this.deleteVendorId(oResult.SUBJECT);
                break;
            case 'customer':
                this.deleteCustomerId(oResult.SUBJECT);
                break;
            case 'project':
                this.removePersonalDataFromProject(oResult.SUBJECT);
                break;
            default:
                break;
            }
        });

        const sStmtSelectVendor = `select firstVendorRecord.vendor_id from
                                        ( Select VENDOR_ID, MIN(_VALID_FROM) AS _VALID_FROM
                                            from "${ Tables.vendor }" 
                                            group by VENDOR_ID) as firstVendorRecord, "${ Tables.personal_data_validity }" as persDataValid 
                                            where  persDataValid.entity = 'VENDOR' AND persDataValid.SUBJECT = '*' AND
                                            firstVendorRecord.vendor_id not in (select subject from "${ Tables.personal_data_validity }" where entity = 'VENDOR')
                                            AND ((persDataValid.VALID_FOR is not null AND ADD_MONTHS(TO_DATE(firstVendorRecord._valid_from), persDataValid.VALID_FOR) < CURRENT_UTCTIMESTAMP) 
                                                OR (persDataValid.VALID_TO is not null AND persDataValid.VALID_TO < CURRENT_UTCTIMESTAMP))`;
        const oResultSetVendor = await dbConnection.executeQuery(sStmtSelectVendor);
        _.each(oResultSetVendor, oResult => {
            this.deleteVendorId(oResult.VENDOR_ID);
        });

        const sStmtSelectCustomer = `select firstCustomerRecord.customer_id from
                    ( Select CUSTOMER_ID, MIN(_VALID_FROM) AS _VALID_FROM
                        from "${ Tables.customer }" 
                        group by CUSTOMER_ID) as firstCustomerRecord, "${ Tables.personal_data_validity }" as persDataValid 
                        where  persDataValid.entity = 'CUSTOMER' AND persDataValid.SUBJECT = '*' AND
                        firstCustomerRecord.customer_id not in (select subject from "${ Tables.personal_data_validity }" where entity = 'CUSTOMER')
                        AND ((persDataValid.VALID_FOR is not null AND ADD_MONTHS(TO_DATE(firstCustomerRecord._valid_from), persDataValid.VALID_FOR) < CURRENT_UTCTIMESTAMP)
                            OR (persDataValid.VALID_TO is not null AND persDataValid.VALID_TO < CURRENT_UTCTIMESTAMP))`;
        const oResultSetCustomer = await dbConnection.executeQuery(sStmtSelectCustomer);
        _.each(oResultSetCustomer, oResult => {
            this.deleteCustomerId(oResult.CUSTOMER_ID);
        });

        const sStmtSelectProject = `select prj.project_id from "${ Tables.project }" as prj, 
                        "${ Tables.personal_data_validity }" as persDataValid 
                        where persDataValid.entity = 'PROJECT' AND persDataValid.SUBJECT = '*' AND 
                        prj.project_id not in (select subject from "${ Tables.personal_data_validity }" where entity = 'PROJECT')
                        AND ((persDataValid.VALID_FOR is not null AND ADD_MONTHS(TO_DATE(prj.CREATED_ON), persDataValid.VALID_FOR) < CURRENT_UTCTIMESTAMP) 
                            OR (persDataValid.VALID_TO is not null AND persDataValid.VALID_TO < CURRENT_UTCTIMESTAMP))`;
        const oResultSetProject = await dbConnection.executeQuery(sStmtSelectProject);
        _.each(oResultSetProject, oResult => {
            this.removePersonalDataFromProject(oResult.PROJECT_ID);
        });


        await dbConnection.commit();
    };




    this.getPersonalData = async function (sEntityId, sEntityType) {
        const sStmtSelect = `select TABLE_NAME, COLUMN_NAME, ENTITY_ID as ENTITY, COUNTER from "${ Views.data_protection_display_info }" where ENTITY_ID = ? and ENTITY_TYPE = ?`;
        const oResultSet = await dbConnection.executeQuery(sStmtSelect, sEntityId, sEntityType);
        return Array.from(oResultSet);
    };










    this.getRetentionData = async function (sEntityID, sEntityType) {
        var aRetentionData = {
            metadata: '',
            data: []
        };
        var sStmtSelect;
        switch (sEntityType) {
        case `CUSTOMER`:
            sStmtSelect = `select CUSTOMER_ID, CUSTOMER_NAME, COUNTRY, POSTAL_CODE, REGION, CITY, STREET_NUMBER_OR_PO_BOX, _VALID_FROM, _VALID_TO, _SOURCE
                    from "${ Tables.customer }" where CUSTOMER_ID = ? order by _VALID_TO`;
            break;
        case `VENDOR`:
            sStmtSelect = `select VENDOR_ID, VENDOR_NAME, COUNTRY, POSTAL_CODE, REGION, CITY, STREET_NUMBER_OR_PO_BOX, _VALID_FROM, _VALID_TO, _SOURCE
                    from "${ Tables.vendor }" where VENDOR_ID = ? order by _VALID_TO`;
            break;
        default:
            return aRetentionData;
        }
        var rsEntities = await dbConnection.executeQuery(sStmtSelect, sEntityID);
        if (rsEntities.length > 0) {
            aRetentionData.metadata = Object.keys(rsEntities[0]).join(`;`);
            rsEntities.forEach(oEntity => {
                aRetentionData.data.push(_.values(oEntity).join(`;`));
            });
        }
        return aRetentionData;
    };
}

DataProtection.prototype = Object.create(DataProtection.prototype);
DataProtection.prototype.constructor = DataProtection;
export default {_,authorizationUnroller,authorizationManager,MessageLibrary,PlcException,Code,MessageDetails,Tables,Procedures,Views,DataProtection};
