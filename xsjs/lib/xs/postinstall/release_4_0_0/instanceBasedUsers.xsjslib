const replaceColumns = [
    '_CREATED_BY',
    'LAST_MODIFIED_BY',
    'USER_ID'
];

function check(oConnection) {
    return true;
}

async function run(oConnection, oLibraryMeta, oRequestArgs) {
    try {
        if (!await validateInstanceBasedUsers(oRequestArgs.file)) {
            throw new Error(`empty user mapping file uploaded, please check your .csv file`);
        }
        ;
        const sSchema = await getCurrentSchema(oConnection);
        const aPLCTables = await getPLCTables(oConnection, sSchema);
        await replaceInstanceBasedUsers(oConnection, aPLCTables, sSchema, oRequestArgs.file);
        return true;
    } catch (e) {
        await console.log(`the instance based users migration failed with error ${ e.message }`);
        throw e;
    }
}

/**
 * replace all user_id in XSC with email in XSA
 * @param oMappingUserList {array} user mapping list
 */
function validateInstanceBasedUsers(oMappingUserList) {
    if (!oMappingUserList || !oMappingUserList.length || oMappingUserList === 'no data') {
        return false;
    } else {
        const xscusers = oMappingUserList.map(item => item[0]);
        let duplicateUser = {};
        for (let j = 0; j < xscusers.length; j++) {
            if (!duplicateUser[xscusers[j]]) {
                duplicateUser[xscusers[j]] = true;
            } else {
                throw Error('duplicate user mapping in the CSV file is uploaded, please check your selected file');
            }
        }

        //the regexp is used to validate the upload csv file format matches the data model
        const oReg = new RegExp('^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(.[a-zA-Z0-9-]+)*.[a-zA-Z0-9]{2,6}$');
        for (let i = 0; i < oMappingUserList.length; i++) {
            if (!oMappingUserList[i][1] || !oReg.test(oMappingUserList[i][1])) {
                throw Error('format exception');
            }
            oMappingUserList[i][1] = oMappingUserList[i][1].toUpperCase();
        }

        //the user mapping csv file's format is <user_id>,<user_email> which is opposite to the update
        //here need reverse the format to match update operation
        oMappingUserList = oMappingUserList.map(aSubArray => {
            return aSubArray.reverse();
        });
        return true;
    }
}

/**
 * create user replacement sql
 * @param sTableName {string} table name
 * @param oConnection {object} current connection
 * @param sColumnName {string} column name 
 * @param currentSchemaName {string} current schema name
 */
function createUserReplaceSql(sTableName, oConnection, sColumnName, currentSchemaName) {
    const oResult = oConnection.executeQuery(`SELECT COLUMN_NAME FROM "SYS"."M_CS_COLUMNS" WHERE SCHEMA_NAME='${ currentSchemaName }' AND TABLE_NAME='${ sTableName }' AND COLUMN_NAME='${ sColumnName }'`);
    let sSql = '';
    if (oResult && oResult.length) {
        sSql = `UPDATE "${ sTableName }" SET ${ sColumnName } = ? WHERE ${ sColumnName } = ?`;
    }

    return sSql;
}

/**
 * get current schema
 * @return current schema
 */
function getCurrentSchema(oConnection) {
    return oConnection.executeQuery(`SELECT CURRENT_SCHEMA FROM DUMMY`)[0].CURRENT_SCHEMA;
}

/**
 * get all tables under current schema
 * @return all PLC tables in current schema
 */
function getPLCTables(oConnection, sSchema) {
    const aTables = oConnection.executeQuery(`SELECT TABLE_NAME FROM "SYS"."M_CS_TABLES" WHERE SCHEMA_NAME = '${ sSchema }'`);
    return aTables.map(item => {
        return item.TABLE_NAME;
    });
}

/**
 * replace all tables' user ids with upload emails
 * @param aPLCTables {array} all table names
 * @param oConnection {object} current connection
 * @param aMappingUserList {array} upload user_id-email mapping
 * @param sSchema {string} current schema name
 */
async function replaceInstanceBasedUsers(oConnection, aPLCTables, sSchema, aMappingUserList) {
    await console.log(`the user mapping list is ${ aMappingUserList }`);
    if (aMappingUserList && aMappingUserList.length && aMappingUserList !== 'no data' && aMappingUserList !== '[]') {
        aPLCTables.map(sTable => {
            for (let column of replaceColumns) {
                const sSql = await createUserReplaceSql(sTable, oConnection, column, sSchema);
                if (sSql && sSql.length) {
                    await console.log(`Replace users in column ${ column } of table ${ sTable }`);
                    oConnection.executeUpdate(sSql, aMappingUserList);
                }
            }
            await oConnection.commit();
        });
    }
}

function clean(oConnection) {
    return true;
}
export default {replaceColumns,check,run,validateInstanceBasedUsers,createUserReplaceSql,getCurrentSchema,getPLCTables,replaceInstanceBasedUsers,clean};
