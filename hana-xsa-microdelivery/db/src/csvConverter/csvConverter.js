"use strict";

const parse = require('csv-parse/lib/sync');
const oFS = require("fs");
const oPath = require("path");

const sGenerateProcFolder = "db/src/init/";
const sProcPrefix = "sap.plc.init::";
const sSuffixProc = ".hdbprocedure";
const sSuffixTable = ".tables";
const sResourceFolder = "db/src/content/";
const sTableResourceFolder= sResourceFolder + "tables/";

const aProceduresToBeGenerated = ["030_StandardContent", "040_UoM_Currencies_ExchangeRates", "050_ExampleContent"];
const aPriceRelatedTables = ["sap.plc.db::basis.t_price_source", "sap.plc.db::basis.t_price_source__text"];
let aPlcNonSampleTables = [];

aProceduresToBeGenerated.forEach(sProcedure => {
    new CsvConverter(sGenerateProcFolder, sProcPrefix, sSuffixProc, sSuffixTable, sResourceFolder, sTableResourceFolder).generateProcedure(sProcedure);
});

function CsvConverter(sGenerateProcFolder, sProcPrefix, sSuffixProc, sSuffixTable, sResourceFolder, sTableResourceFolder){

    this.oCsvProperties = {
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
            return (!value.length && !context.quoting)? "NULL" : value; 
        }
    };

    this.sGenerateProcFolder = sGenerateProcFolder;
    this.sProcPrefix = sProcPrefix;
    this.sSuffixProc = sSuffixProc;
    this.sSuffixTable = sSuffixTable;
    this.sResourceFolder = sResourceFolder;
    this.sTableResourceFolder= sTableResourceFolder;
   
    this.generateProcedure = function(sProcName){

        const sProcPathFile = oPath.join(this.sGenerateProcFolder,sProcName + this.sSuffixProc);
        const sTablePathFile = oPath.join(this.sTableResourceFolder,sProcName + this.sSuffixTable);
        try{
            console.log("creating the " + sProcName + " hdbprocedure file");
            if (oFS.existsSync(sProcPathFile)) {
                console.log("deleting " + sProcPathFile);
                oFS.unlinkSync(sProcPathFile);
            }
            const aPlcTableNames = this.getPlcTableNames(sTablePathFile, sProcName); // take every dependent table from ProcedureName.table file
            const sProcedure = this.generateProcBody(this.sProcPrefix + sProcName, aPlcTableNames);
            oFS.writeFileSync(sProcPathFile,sProcedure);
            console.log("successfully created the " + sProcName + " hdbprocedure file");
        } catch(e){
            console.log("ERROR: " + e.message);
        }
    }

    this.getPlcTableNames = function(sTablePathFile, sProcName){
        let aPlcTableNames = []
        try{
            oFS.readFileSync(sTablePathFile, 'utf-8').split(/\r?\n/).forEach(function(line){
                if(line.length){
                    const sTableName = line.split(";",-1)[0].replace(/"/g,"");
                    aPlcTableNames.push(sTableName);
                    if (sProcName !== "050_ExampleContent"){
                        aPlcNonSampleTables.push(sTableName);
                    }
                }
            });
        } catch(e){
            console.log("ERROR: one or more csv files not included");
            throw e;
        }

        return aPlcTableNames;
    }

    this.generateProcBody = function(sProcNameWithPrefix, aPlcTableNames){
        const sProcedureHeader = "PROCEDURE \"" + sProcNameWithPrefix +"\"()\n"
            + "\tLANGUAGE SQLSCRIPT\n"
            + "\tSQL SECURITY INVOKER AS\n"
            + "BEGIN\n";

        let sCleanStandardContent = "";
        if(sProcNameWithPrefix.includes("030_StandardContent")){
            sCleanStandardContent = this.standardContentCleanTables(aPlcTableNames);
        } 
        else if(sProcNameWithPrefix.includes("050_ExampleContent")){
            // in this case we take every csv from content folder that does not apper in the other 2 procedures
            // and we concat them with specific csv's from 050_ExampleContent.tables
            aPlcTableNames = this.filterSampleDataTables(sProcNameWithPrefix, aPlcTableNames).concat(aPlcTableNames);
        }

        const sLoadDataFromCsv = this.loadDataFromCsv(sProcNameWithPrefix, aPlcTableNames);
        return sProcedureHeader + sCleanStandardContent + sLoadDataFromCsv + "\nEND;";
    }

    this.standardContentCleanTables = function(aPlcTableNames){
        const sDeleteStatement = "" 
        + "DELETE FROM \"sap.plc.db::basis.t_metadata_item_attributes\" " 
        + "WHERE (PATH, BUSINESS_OBJECT, COLUMN_ID) " 
        + "NOT IN (SELECT PATH, BUSINESS_OBJECT, COLUMN_ID FROM \"sap.plc.db::basis.t_metadata\" WHERE IS_CUSTOM = 1);\n"
        + "DELETE FROM \"sap.plc.db::basis.t_metadata__text\" " 
        + "WHERE (PATH, COLUMN_ID) NOT IN " 
        + "(SELECT PATH, COLUMN_ID "
        + "FROM \"sap.plc.db::basis.t_metadata\" WHERE IS_CUSTOM = 1);\n"
        + "DELETE FROM \"sap.plc.db::basis.t_metadata\" "  
        + "WHERE IS_CUSTOM != 1;\n"
        + "DELETE FROM \"sap.plc.db::basis.t_price_source\" " 
        + "WHERE PRICE_SOURCE_TYPE_ID = 3 OR PRICE_SOURCE_TYPE_ID = 4;\n"
        + "DELETE FROM \"sap.plc.db::basis.t_price_source__text\" WHERE PRICE_SOURCE_TYPE_ID = 3 OR PRICE_SOURCE_TYPE_ID = 4;\n";

        const sTableNamePrefix = "sap.plc.db::";
        let aNonTruncateTables = ["basis.t_metadata_item_attributes", "basis.t_metadata__text", "basis.t_metadata", "basis.t_language", 
                                    "basis.t_formula", "basis.t_price_source", "basis.t_price_source__text", "map.t_field_mapping", "map.t_destination_entity", "basis.t_item_category", "basis.t_item_category__text",
                                    "basis.t_layout","basis.t_layout_column"];
        aNonTruncateTables = aNonTruncateTables.map(sTable => sTableNamePrefix + sTable);
        
        let sTruncateStatement = ``;
        aPlcTableNames.forEach(sTableName => {
            if(!aNonTruncateTables.includes(sTableName)){
                sTruncateStatement += `TRUNCATE TABLE "${sTableName}";\n`;
            }
        });
        
        return sDeleteStatement + sTruncateStatement;
    }

    this.filterSampleDataTables = function(){
        
        const aAllTables = this.getAllTablesFromContentFolder();
        console.log("total number of tables:" + aAllTables.length);
        const aSampleTables = aAllTables.filter(sTable => !aPlcNonSampleTables.includes(sTable));
        console.log("number of tables not containing sample data is:" + aPlcNonSampleTables.length);
        console.log("number of tables containing sample data is:" + aSampleTables.length);
        return  aSampleTables;
    }

    this.loadDataFromCsv = function(sProcNameWithPrefix, aPlcTableNames){
        
        let sGeneratedFromCsv = ``;
        const sPrimaryKeyOption = " WITH PRIMARY KEY;\n";
        const sTransaction = `BEGIN AUTONOMOUS TRANSACTION\n\tDECLARE EXIT HANDLER FOR SQL_ERROR_CODE 301 SELECT ::SQL_ERROR_CODE, ::SQL_ERROR_MESSAGE FROM "sap.plc.db::DUMMY";\n\t`;

        aPlcTableNames.forEach(sTableName => { // example sTableName = "sap.plc.db::basis.t_application_timeout"
            
            const sTableNameWithoutPrefix = sTableName.substring(sTableName.lastIndexOf(".") + 1);
            const sCsvFilePath = this.sResourceFolder + sTableNameWithoutPrefix + ".csv";
            try{
            const aParsedRows = this.csvToObjects(sCsvFilePath, this.oCsvProperties);
            
            aParsedRows.forEach(row => {
                if(this.validatePriceType(sProcNameWithPrefix, sTableName, row) && this.validateExchangeType(sTableName, row)){
                    if (sTableName === "sap.plc.db::map.t_destination_entity" || sTableName === "sap.plc.db::map.t_field_mapping") {
                        sGeneratedFromCsv += this.generateProcedureBodyForReplicationTables(row, sTableName);
                    } else {
                        let sStatement = `"${sTableName}"`;
                        let aValues = Object.values(row).map(value => value == "NULL" ? value : "\'" + value + "\'");
                        sStatement += " (" + Object.keys(row).join(',') + ") VALUES (" + aValues.join(',') + ")";
                        sStatement = sTableName === "sap.plc.db::basis.t_language" ?
                            sTransaction + "INSERT INTO " + sStatement + ";\nEND;\n" :
                            "UPSERT " + sStatement + sPrimaryKeyOption;
                        sGeneratedFromCsv += sStatement;
                    }
                }
            });
            } catch(e){
                console.log("ERROR: Error found at file:" + sCsvFilePath);
                throw e;
            }
            
        });
        return sGeneratedFromCsv;
    }

    this.generateProcedureBodyForReplicationTables = function(aData, sTableName) {
        if (sTableName === "sap.plc.db::map.t_destination_entity") {
            // If the entry exists, UPDATE everything but INPUT_SQL and REPL_STATUS
            let sStatement = `IF EXISTS(SELECT * FROM "${sTableName}" WHERE "ID" = ${aData['ID']}) THEN 
                                    UPDATE "${sTableName}" SET 
                                        "TABLE_NAME" = '${aData['TABLE_NAME']}', 
                                        "LABEL" = '${aData['LABEL']}', 
                                        "DESCRIPTION" = '${aData['DESCRIPTION']}', 
                                        "INPUT_SQL_DEFAULT" = '${aData['INPUT_SQL_DEFAULT']}', 
                                        "IS_REPL_MANDATORY" = '${aData['IS_REPL_MANDATORY']}' 
                                    WHERE "ID" = ${aData['ID']}; `;
            // If the entry doesn't exists, INSERT
            sStatement += `ELSE 
                               INSERT INTO "${sTableName}" (ID, TABLE_NAME, LABEL, DESCRIPTION, INPUT_SQL_DEFAULT, 
                                    IS_REPL_MANDATORY, REPL_STATUS) 
                               VALUES('${aData['ID']}', '${aData['TABLE_NAME']}', '${aData['LABEL']}', 
                                   '${aData['DESCRIPTION']}', '${aData['INPUT_SQL_DEFAULT']}',  
                                   ${aData['IS_REPL_MANDATORY']}, '${aData['REPL_STATUS']}'); 
                           END IF; `;
            return sStatement;
        } else if (sTableName === "sap.plc.db::map.t_field_mapping") {
            // If the entry exists, UPDATE everything but INPUT_SQL and REPL_STATUS
            let sStatement = `IF EXISTS(SELECT * FROM "${sTableName}" WHERE "ID" = ${aData['ID']}) THEN  
                                    UPDATE "${sTableName}" SET "TABLE_NAME" = '${aData['TABLE_NAME']}', 
                                        "COLUMN_NAME" = '${aData['COLUMN_NAME']}',  "FIELD_TYPE" = '${aData['FIELD_TYPE']}',  
                                        "IS_PK" = ${aData['IS_PK']}, 
                                        "MAPPED_COLUMN_DEFAULT" = '${aData['MAPPED_COLUMN_DEFAULT']}', 
                                        "FIELD_ORDER" = ${aData['FIELD_ORDER']}, 
                                        "IS_MANDATORY" = ${aData['IS_MANDATORY']}, 
                                        "IS_NULLABLE" = ${aData['IS_NULLABLE']}, 
                                        "VALIDATION_REGEX" = '${aData['VALIDATION_REGEX']}', 
                                        "IS_CUSTOM" = ${aData['IS_CUSTOM']}, 
                                        "IS_UPPERCASE" = ${aData['IS_UPPERCASE']}, 
                                        "LENGTH" = ${aData['LENGTH']}, 
                                        "SCALE" = ${aData['SCALE']}, 
                                        "PRECISION" = ${aData['PRECISION']}, 
                                        "DESCRIPTION" = '${aData['DESCRIPTION']}' 
                                    WHERE "ID" = ${aData['ID']}; `;
            // If the entry doesn't exists, INSERT
            sStatement += `ELSE 
                                INSERT INTO "${sTableName}" (ID, TABLE_NAME, COLUMN_NAME, FIELD_TYPE, IS_PK,  
                                    MAPPED_COLUMN_DEFAULT, FIELD_ORDER, IS_MANDATORY, IS_NULLABLE, VALIDATION_REGEX, IS_CUSTOM, 
                                    IS_UPPERCASE, LENGTH, SCALE, PRECISION, DESCRIPTION) 
                                VALUES('${aData['ID']}', '${aData['TABLE_NAME']}', '${aData['COLUMN_NAME']}', 
                                    '${aData['FIELD_TYPE']}', ${aData['IS_PK']}, '${aData['MAPPED_COLUMN_DEFAULT']}', 
                                    ${aData['FIELD_ORDER']}, ${aData['IS_MANDATORY']}, ${aData['IS_NULLABLE']}, '${aData['VALIDATION_REGEX']}', 
                                    ${aData['IS_CUSTOM']}, ${aData['IS_UPPERCASE']}, ${aData['LENGTH']}, ${aData['SCALE']}, 
                                    ${aData['PRECISION']}, '${aData['DESCRIPTION']}'); 
                            END IF; `;
            return sStatement;
        }
    }

    this.getAllTablesFromContentFolder = function(){
        let aTableNames = [];
        let aMapTableNames = ["t_destination_entity", "t_field_mapping", "t_depends_on", "t_uom_mapping", "t_dimension_mapping"];
        try {
            const aFiles =oFS.readdirSync(this.sResourceFolder)
            aFiles.forEach(sFileName =>{
                if(sFileName.includes(".csv")){
                    const sTableName = sFileName.substring(0,sFileName.lastIndexOf("."));
                    if (aMapTableNames.indexOf(sTableName) !== -1) {
                        aTableNames.push("sap.plc.db::map." + sTableName);
                    } else {
                        aTableNames.push("sap.plc.db::basis." + sTableName);
                    }
                }
            });
        } catch(e){
            console.log("ERROR: error at reading files from content");
            throw err;
        }
        return aTableNames;
    }

    this.validatePriceType = function(sProcedureName,sTable,oRow){

        if(!aPriceRelatedTables.includes(sTable)){
            return true;
        } 
        const iPriceType = oRow['PRICE_SOURCE_TYPE_ID'];
        if(sProcedureName.includes("030_StandardContent")){
            return iPriceType >=3 && iPriceType <=5;
        }
        if(sProcedureName.includes("050_ExampleContent")){
            return iPriceType < 3 || iPriceType > 5;
        }
        return true;
    }

    this.validateExchangeType = function(sTable,oRow){
        if (sTable != "sap.plc.db::basis.t_exchange_rate_type"){
            return true;
        } else{
            return oRow['EXCHANGE_RATE_TYPE_ID'] == 'STANDARD';
        }
    }

    this.csvToObjects = function(sCsvFilePath, oCsvProperties) {
        var fileData = oFS.readFileSync(sCsvFilePath);
        return parse(fileData, oCsvProperties);
    }
}

CsvConverter.prototype = Object.create(CsvConverter.prototype);
CsvConverter.prototype.constructor = CsvConverter;
module.exports.CsvConverter = CsvConverter;