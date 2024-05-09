var fs = $.require("fs");

var DbArtefactController = $.require("../../../lib/xs/db/generation/hdi-db-artefact-controller").DbArtefactController;

var Connection = new ($.require("../../../lib/xs/db/connection/connection")).ConnectionFactory($);
var oConnection = Connection.getConnection();
var oController = new DbArtefactController($, oConnection);

const parse = $.require('csv-parse/lib/sync');
const PLCTestRunner = $.import("testtools.testrunner", "testrunner").PLCTestRunner;
let oTestRunner = new PLCTestRunner($.request, $.response, oController, oConnection);
oTestRunner.cleanUpForAuitTest();

var upsertResult = {
    "message" : "Upsert Success!",
    "tabledataList": []
};
var aUpsertList = [];
var aMapTables = ["t_depends_on.csv", "t_destination_entity.csv", "t_dimension_mapping.csv", "t_field_mapping.csv", "t_uom_mapping.csv"];
//define the location of .hdbtabledata files
/**
* When deployment for AUIT tests, should do three items firstly:
* update sDbContentFolderName to "lib/db/content/";
* cp db/src/content/*.csv xsjs/test/sap/db/content
* cp -r xsjs/test xsjs/lib/
*/
let sDbContentFolderName = "lib/db/content/";
let aFiles = fs.readdirSync(sDbContentFolderName);
let aErrorMessages = [];
let oCsvProperties = {
    columns: true,
    delimiter:',',
    headers: true,
    quoting:true,
    skip_empty_lines:true,
    cast: function(value, context){
        if(value.includes('json')){ // special handling for json properties -> double the quotes of properties
            let jsonValue = value.substring(value.lastIndexOf("json"));
            jsonValue = jsonValue.replace(/\\/g, '')
            jsonValue = jsonValue.split('').map(char => char=='"'? char + char : char).join('');       
            value = "\"" + value.substring(0, value.lastIndexOf("json")) + jsonValue + "\"";
        }
        // check between ,, which is NULL and ,"", which is emptry string
        return (!value.length && !context.quoting)? null : value; 
    }
};

//upsert .hdbtabledata files
for (sFileName of aFiles) {
    if (sFileName.endsWith(".csv") && sFileName !== "t_system_message.csv")
    {
        try {
            // Skip map tables
            if (aMapTables.includes(sFileName) == true) continue;

            let oTable = parseCsvFile(sFileName);
            // Clean up the data produced by auit
            oConnection.executeUpdate(`TRUNCATE TABLE "sap.plc.db::basis.${oTable.sName}"`);
            // If the csv file only contains header, ignore it.
            if (oTable.aLines.length == 0) continue;
            // Placeholder for columns when insert/upsert, e.g. (?,?)
            let sPlaceholder = oTable.sHeader.split(",").fill("?").join(",");
            oConnection.executeUpdate(`UPSERT "sap.plc.db::basis.${oTable.sName}" (${oTable.sHeader}) VALUES (${sPlaceholder}) WITH PRIMARY KEY`, oTable.aLines);
            upsertResult.tabledataList.push(`sap.plc.db::basis.${oTable.sName}`);
        } catch (ex) {
             aErrorMessages.push(ex);
        }
    }
    if (aErrorMessages.length != 0) {
        upsertResult.message = aErrorMessages.join(",");
    }
}

function parseCsvFile(sFileName) {
    let sTableName = sFileName.substr(0, sFileName.lastIndexOf(".csv"));
    let aLines = [];
    let sHeader = "";

    let aFileContent = fs.readFileSync(sDbContentFolderName + sFileName, "utf8");
    let aLinesAsJSONObjects = parse(aFileContent, oCsvProperties);

    if(aLinesAsJSONObjects.length > 0) {
        sHeader = Object.keys(aLinesAsJSONObjects[0]).join(",");

        if (sTableName == "t_costing_sheet_overhead_row_formula" || sTableName == "t_item_category__text") {
            aLinesAsJSONObjects.forEach((element) => {
                let aJSONPropertiesAsArray = [];
                Object.keys(element).forEach((key) => {
                    aJSONPropertiesAsArray.push(element[key].replace(/''/g, "'"));
                });
                aLines.push(aJSONPropertiesAsArray);
            });
        }
        else {
            aLinesAsJSONObjects.forEach((element) => {
                let aJSONPropertiesAsArray = [];
                Object.keys(element).forEach((key) => {
                    aJSONPropertiesAsArray.push(element[key]);
                });
                aLines.push(aJSONPropertiesAsArray);
            });
        }
    }

    return {
        "sName": sTableName,
        "sHeader": sHeader,
        "aLines": aLines
    };
}

function generateHDBTableData(csvFileName)
{
    var csvPath = "db.content";
    var content = {
          "format_version": 1,
          "imports":
          [
              {
                  "source_data" : {
                      "data_type" : "CSV",
                      "file_name" : csvPath + "::"+ csvFileName + ".csv",
                      "has_header" : true,
                      "no_data_import": false,
                      "delete_existing_foreign_data": false,
                      "dialect"   : "HANA",
                      "type_config" : {
                          "delimiter" : ",",
                          "do_quote" : true
                      }
                  },
                  "target_table" : "sap.plc.db::basis." + csvFileName
              }
          ]
    };
    if(csvFileName === "t_frontend_settings")
    {
        content.imports[0].source_data.type_config.delimiter = ";";
    }
    if(csvFileName === "t_uom__text")
    {
        content.imports[0].source_data.type_config.do_quote = false;
    }
    return JSON.stringify(content);

}

//clean-up of authorization tables - user and group privileges and rollup table - (remove instance-based privileges of deleted projects)
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_project\" where project_id not in " +
                                "( select project_id from \"sap.plc.db::basis.t_project\" )");
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_user\" where object_type = 'PROJECT' and object_id not in " +
                                "( select project_id from \"sap.plc.db::basis.t_project\" )");
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_auth_usergroup\" where object_type = 'PROJECT' and object_id not in " +
                                "( select project_id from \"sap.plc.db::basis.t_project\" )");

//delete groups
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup\" where USERGROUP_ID != 'ALL_USERS_OF_PLC_VERSION_2_0'");
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_user\" where USERGROUP_ID != 'ALL_USERS_OF_PLC_VERSION_2_0'");
oConnection.executeUpdate("delete from \"sap.plc.db::auth.t_usergroup_usergroup\" where PARENT_USERGROUP_ID != 'ALL_USERS_OF_PLC_VERSION_2_0'");

//delete data from recent calculation versions table
oConnection.executeUpdate("delete from \"sap.plc.db::basis.t_recent_calculation_versions\"");

// simulate opening of Pump calculation P-100
oConnection.executeUpdate("insert into \"sap.plc.db::basis.t_open_calculation_versions\" (session_id, calculation_version_id, is_writeable) values ('#CONTROLLER', 1, 1)");
oConnection.executeUpdate("insert into \"sap.plc.db::basis.t_open_calculation_versions\" (session_id, calculation_version_id, is_writeable) values ('#CONTROLLER', 2, 1)");
oConnection.executeUpdate("insert into \"sap.plc.db::basis.t_open_calculation_versions\" (session_id, calculation_version_id, is_writeable) values ('#CONTROLLER', 3, 1)");


//delete entries from t_lock, t_user_activity table if anything fails before, we still want to use the system
oConnection.executeUpdate("delete from \"sap.plc.db::basis.t_user_activity\"");
oConnection.executeUpdate("delete from \"sap.plc.db::basis.t_lock\"");

//invalidate all sessions, leave
oConnection.executeUpdate("delete from \"sap.plc.db::basis.t_session\"");
oConnection.executeUpdate("insert into \"sap.plc.db::basis.t_session\" (session_id, user_id, language, last_activity_time) values ('#CONTROLLER', '#CONTROLLER', 'EN', '2099-12-24')");




oConnection.commit();

oConnection.close();
   
$.response.contentType = "text/plain";
$.response.setBody(JSON.stringify(upsertResult));
$.response.status = $.net.http.OK;
