function check(oConnection) {
    return true;
}

function clean(oConnection) {
    return true;
}

async function run(oConnection) {
    var sUser = 'postInstall';
    const dDate = new Date().toJSON();
    const sLifecycleValuesOld = 'sap.plc.db::basis.t_lifecycle_period_value';
    const sProjectTotalQuantites = 'sap.plc.db::basis.t_project_total_quantities';
    const sLifecycleValuesNew = 'sap.plc.db::basis.t_project_lifecycle_period_quantity_value';
    const sProjectLifecycleConfiguration = 'sap.plc.db::basis.t_project_lifecycle_configuration';

    try {
        //copy data from t_lifecycle_period_value to t_project_lifecycle_period_quantity_value
        oConnection.executeUpdate(`
            insert into  "${ sLifecycleValuesNew }" (PROJECT_ID, CALCULATION_ID, LIFECYCLE_PERIOD_FROM, VALUE, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
            select project.PROJECT_ID, totalQuantities.CALCULATION_ID, lifecycle.LIFECYCLE_PERIOD_FROM, lifecycle.VALUE, '${ dDate }' as LAST_MODIFIED_ON, '${ sUser }' as LAST_MODIFIED_BY
                from "${ sLifecycleValuesOld }" lifecycle
                inner join "sap.plc.db::basis.t_project_total_quantities" totalQuantities
                    on lifecycle.RULE_ID = totalQuantities.RULE_ID
                inner join "sap.plc.db::basis.t_calculation" calculation
                    on calculation.CALCULATION_ID  = totalQuantities.CALCULATION_ID
                inner join "sap.plc.db::basis.t_project" project
                    on calculation.PROJECT_ID =  project.PROJECT_ID and project.START_OF_PROJECT IS NOT NULL and project.END_OF_PROJECT IS NOT NULL and project.LIFECYCLE_VALUATION_DATE IS NOT NULL;
         `);

        //copy data from t_project_total_quantities to t_project_lifecycle_configuration
        oConnection.executeUpdate(`
            insert into  "${ sProjectLifecycleConfiguration }" (PROJECT_ID, CALCULATION_ID, CALCULATION_VERSION_ID, IS_ONE_TIME_COST_ASSIGNED, MATERIAL_PRICE_SURCHARGE_STRATEGY, ACTIVITY_PRICE_SURCHARGE_STRATEGY, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
            select project.PROJECT_ID, totalQuantities.CALCULATION_ID, totalQuantities.CALCULATION_VERSION_ID, 0, totalQuantities.MATERIAL_PRICE_SURCHARGE_STRATEGY, totalQuantities.ACTIVITY_PRICE_SURCHARGE_STRATEGY, totalQuantities.LAST_MODIFIED_ON, totalQuantities.LAST_MODIFIED_BY
                from "${ sProjectTotalQuantites }" totalQuantities
                inner join "sap.plc.db::basis.t_calculation" calculation
                    on calculation.CALCULATION_ID  = totalQuantities.CALCULATION_ID
                inner join "sap.plc.db::basis.t_project" project
                    on calculation.PROJECT_ID =  project.PROJECT_ID and project.START_OF_PROJECT IS NOT NULL and project.END_OF_PROJECT IS NOT NULL and project.LIFECYCLE_VALUATION_DATE IS NOT NULL
        `);

        //add entries for each project in t_project_lifecycle_period_type
        let aProjects = oConnection.executeQuery(`select PROJECT_ID, YEAR(START_OF_PROJECT) as FIRST_YEAR, YEAR(END_OF_PROJECT) as LAST_YEAR  from "sap.plc.db::basis.t_project" where START_OF_PROJECT IS NOT NULL and END_OF_PROJECT IS NOT NULL and LIFECYCLE_VALUATION_DATE IS NOT NULL `);
        if (aProjects.length != 0) {
            var aDataToInsert = [];
            aProjects.forEach(project => {
                let iCurrentEntry = project.FIRST_YEAR;
                let iLastEntry = project.LAST_YEAR;
                while (iCurrentEntry <= iLastEntry) {
                    aValues = [
                        project.PROJECT_ID,
                        iCurrentEntry,
                        1,
                        'YEARLY',
                        dDate,
                        sUser
                    ];
                    aDataToInsert.push(aValues);
                    iCurrentEntry += 1;
                }
            });
            oConnection.executeUpdate(`INSERT INTO "sap.plc.db::basis.t_project_lifecycle_period_type" (PROJECT_ID, YEAR, IS_YEAR_SELECTED, PERIOD_TYPE, LAST_MODIFIED_ON, LAST_MODIFIED_BY)
            VALUES (?, ?, ?, ?, ?, ?)`, aDataToInsert);
        }
    } catch (e) {
        await console.log('error:', e.message);
        throw new Error(`Lifecyle periods migration failed: ${ e.message }`);
    }

    await validateAllDataHasBeenCopied(oConnection, sLifecycleValuesOld, sLifecycleValuesNew);
    await validateAllDataHasBeenCopied(oConnection, sProjectTotalQuantites, sProjectLifecycleConfiguration);

    await oConnection.commit();
    return true;
}

function validateAllDataHasBeenCopied(oConnection, sOldTable, sNewTable) {

    let iNoOfNewEntriesOldTable = oConnection.executeQuery(`select count(RULE_ID) as NUMBER_OF_ENTRIES  from "${ sOldTable }"`);
    let iNoOfNewEntriesNewTable = oConnection.executeQuery(`select count(PROJECT_ID) as NUMBER_OF_ENTRIES  from "${ sNewTable }"`);

    //delete entries in table if copy was succsesfull
    if (iNoOfNewEntriesOldTable.NUMBER_OF_ENTRIES === iNoOfNewEntriesNewTable.NUMBER_OF_ENTRIES) {
        oConnection.executeUpdate(`delete from "${ sOldTable }"`);
    }

}
export default {check,clean,run,validateAllDataHasBeenCopied};
