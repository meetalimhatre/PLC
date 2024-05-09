const sXSCSchema = "SAP_PLC";
const sPriceSourceTable = "sap.plc.db::basis.t_price_source";
const sDestinationEntityTable = "sap.plc.db::map.t_destination_entity";
const sFieldMappingTable = "sap.plc.db::map.t_field_mapping";
const sDependsOnTable = "sap.plc.db::map.t_depends_on";
const sUomMappingTable = "sap.plc.db::map.t_uom_mapping";
const sDimensionMappingTable = "sap.plc.db::map.t_dimension_mapping";
//the test data comes from t_price_source.csv, it need to be updated if csv file changes.
const oCSVPriceSourceData = {
    PRICE_SOURCE_ID: "PLC_PROJECT_PRICE",
    PRICE_SOURCE_TYPE_ID: 1,
    CONFIDENCE_LEVEL_ID: 5,
    DETERMINATION_SEQUENCE: 1,
    CREATED_ON: "2000-01-01T00:00:00.000Z",
    CREATED_BY: "#CONTROLLER",
    LAST_MODIFIED_ON: "2000-01-01T00:00:00.000Z",
    LAST_MODIFIED_BY: "#CONTROLLER"
};

const oDestinationEntityData = {
    ID: 14,
    TABLE_NAME: 't_material',
    LABEL: 'Material',
    DESCRIPTION: 'Material',
    INPUT_SQL_DEFAULT: 'select * from dummy',
    INPUT_SQL: 'select 1 as demo from dummy',
    IS_REPL_MANDATORY: 0,
    REPL_STATUS: 'LOCAL'
};

const oFieldMappingData = {
    ID: 33,
    TABLE_NAME: 't_company_code',
    COLUMN_NAME: 'COMPANY_CODE_CURRENCY_ID',
    FIELD_TYPE: 'NVARCHAR(3)',
    IS_PK: null,
    MAPPED_COLUMN: 'DEMO',
    MAPPED_COLUMN_DEFAULT: 'WAERS',
    FIELD_ORDER: 567,
    IS_MANDATORY: 0,
    IS_NULLABLE: 1,
    VALIDATION_REGEX: '',
    IS_CUSTOM: 0,
    IS_UPPERCASE: 0,
    LENGTH: 1,
    SCALE: 1,
    PRECISION: 1,
    DESCRIPTION: '34534'
};

const oDependsOnData = {
    TABLE_NAME: 't_overhead_group',
    DEPENDS_ON_TABLE_NAME: 't_plant'
};

const oUomMapping = {
    SOURCE_UOM_ID: 'ST',
    DESTINATION_UOM_ID: 'PC'
};

const oDimensionMapping = {
    SOURCE_DIMENSION_ID: 'FREQU',
    DESTINATION_DIMENSION_ID: 'FREQUENCY'
};

describe("test standard data price source table insert", () => {
    if (jasmine.plcTestRunParameters.mode === "assert") {
        it("compare standard data", ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        PRICE_SOURCE_ID,
                        PRICE_SOURCE_TYPE_ID,
                        CONFIDENCE_LEVEL_ID,
                        DETERMINATION_SEQUENCE,
                        CREATED_ON,
                        CREATED_BY,
                        LAST_MODIFIED_ON,
                        LAST_MODIFIED_BY
                    FROM   
                        "${sPriceSourceTable}" 
                    WHERE 
                        PRICE_SOURCE_TYPE_ID = '${oCSVPriceSourceData["PRICE_SOURCE_TYPE_ID"]}'
                    AND
                        PRICE_SOURCE_ID = '${oCSVPriceSourceData["PRICE_SOURCE_ID"]}'`);
            transferQueryValue(oResult[0]);
            console.log(oResult[0]);
            expect(oResult[0]).toMatchData(oCSVPriceSourceData, Object.keys(oResult[0]));
        });
    }
});

describe("test replication data insert", () => {
    if (jasmine.plcTestRunParameters.mode === "prepare") {
        jasmine.dbConnection.executeUpdate(`DELETE FROM "${sDestinationEntityTable}";`);
        jasmine.dbConnection.executeUpdate(`DELETE FROM "${sFieldMappingTable}";`);
        jasmine.dbConnection.executeUpdate(`INSERT INTO "${sDestinationEntityTable}" 
                    (ID, TABLE_NAME, LABEL, DESCRIPTION,INPUT_SQL_DEFAULT,INPUT_SQL,IS_REPL_MANDATORY,REPL_STATUS)
                    VALUES ('${oDestinationEntityData.ID}', '${oDestinationEntityData.TABLE_NAME}', '${oDestinationEntityData.LABEL}', 
                    '${oDestinationEntityData.DESCRIPTION}','${oDestinationEntityData.INPUT_SQL_DEFAULT}','${oDestinationEntityData.INPUT_SQL}',
                    '${oDestinationEntityData.IS_REPL_MANDATORY}', '${oDestinationEntityData.REPL_STATUS}');`);
        jasmine.dbConnection.executeUpdate(`INSERT INTO "${sFieldMappingTable}"
                    (ID, TABLE_NAME, COLUMN_NAME, FIELD_TYPE, IS_PK,MAPPED_COLUMN,MAPPED_COLUMN_DEFAULT,FIELD_ORDER,
                    IS_MANDATORY,IS_NULLABLE,VALIDATION_REGEX,IS_CUSTOM,IS_UPPERCASE,LENGTH,SCALE,PRECISION,DESCRIPTION)
                    VALUES (${oFieldMappingData.ID}, '${oFieldMappingData.TABLE_NAME}', '${oFieldMappingData.COLUMN_NAME}', 
                   '${oFieldMappingData.FIELD_TYPE}',${oFieldMappingData.IS_PK}, '${oFieldMappingData.MAPPED_COLUMN}', 
                   '${oFieldMappingData.MAPPED_COLUMN_DEFAULT}', ${oFieldMappingData.FIELD_ORDER},
                   ${oFieldMappingData.IS_MANDATORY}, ${oFieldMappingData.IS_NULLABLE}, '${oFieldMappingData.VALIDATION_REGEX}', 
                   ${oFieldMappingData.IS_CUSTOM},${oFieldMappingData.IS_UPPERCASE}, ${oFieldMappingData.LENGTH}, 
                   ${oFieldMappingData.SCALE}, ${oFieldMappingData.PRECISION},'${oFieldMappingData.DESCRIPTION}');`);
        jasmine.dbConnection.commit();
    }
    if (jasmine.plcTestRunParameters.mode === "assert") {
        it(`compare replication data -> table ${sDestinationEntityTable}`, ()=> {
            let oCountTotal = jasmine.dbConnection.executeQuery(`SELECT * FROM "${sDestinationEntityTable}";`);
            let oCountInserted = jasmine.dbConnection.executeQuery(`SELECT * FROM "${sDestinationEntityTable}" 
                                                        WHERE "TABLE_NAME" != '${oDestinationEntityData["TABLE_NAME"]}';`);
            let oResult = jasmine.dbConnection.executeQuery(`SELECT TABLE_NAME, INPUT_SQL, REPL_STATUS FROM "${sDestinationEntityTable}" 
                                                        WHERE TABLE_NAME = '${oDestinationEntityData["TABLE_NAME"]}'`);
            expect(oResult[0].INPUT_SQL).toBe(oDestinationEntityData.INPUT_SQL);
            expect(oResult[0].REPL_STATUS).toBe(oDestinationEntityData.REPL_STATUS);
            expect(oCountTotal.length - 1).toBe(oCountInserted.length);
        });
        it(`compare replication data -> table ${sFieldMappingTable}`, ()=> {
            let oCountTotal = jasmine.dbConnection.executeQuery(`SELECT * FROM "${sFieldMappingTable}";`);
            let oCountInserted = jasmine.dbConnection.executeQuery(`SELECT * FROM "${sFieldMappingTable}" 
                                                        WHERE "COLUMN_NAME" != '${oFieldMappingData["COLUMN_NAME"]}';`);
            let oResult = jasmine.dbConnection.executeQuery(`SELECT COLUMN_NAME, MAPPED_COLUMN FROM "${sFieldMappingTable}" 
                                                        WHERE "COLUMN_NAME" = '${oFieldMappingData["COLUMN_NAME"]}'`);
            expect(oResult[0].MAPPED_COLUMN).toBe(oFieldMappingData.MAPPED_COLUMN);
            expect(oCountTotal.length - 1).toBe(oCountInserted.length);
        });
        it(`compare replication data -> table ${sDependsOnTable}`, ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        TABLE_NAME,
                        DEPENDS_ON_TABLE_NAME
                    FROM   
                        "${sDependsOnTable}" 
                    WHERE 
                        TABLE_NAME = '${oDependsOnData["TABLE_NAME"]}'
                    AND
                        DEPENDS_ON_TABLE_NAME = '${oDependsOnData["DEPENDS_ON_TABLE_NAME"]}'`);
            expect(oResult[0]).toMatchData(oDependsOnData, Object.keys(oResult[0]));
        });
        it(`compare mapping data -> table ${oUomMapping}`, ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        SOURCE_UOM_ID,
                        DESTINATION_UOM_ID
                    FROM   
                        "${sUomMappingTable}" 
                    WHERE 
                    SOURCE_UOM_ID = '${oUomMapping["SOURCE_UOM_ID"]}'
                    AND
                    DESTINATION_UOM_ID = '${oUomMapping["DESTINATION_UOM_ID"]}'`);
            expect(oResult[0]).toMatchData(oUomMapping, Object.keys(oResult[0]));
        });
        it(`compare mapping data -> table ${oDimensionMapping}`, ()=> {
            let oResult = jasmine.dbConnection.executeQuery(`SELECT 
                        SOURCE_DIMENSION_ID,
                        DESTINATION_DIMENSION_ID
                    FROM   
                        "${sDimensionMappingTable}" 
                    WHERE 
                    SOURCE_DIMENSION_ID = '${oDimensionMapping["SOURCE_DIMENSION_ID"]}'
                    AND
                    DESTINATION_DIMENSION_ID = '${oDimensionMapping["DESTINATION_DIMENSION_ID"]}'`);
            expect(oResult[0]).toMatchData(oDimensionMapping, Object.keys(oResult[0]));
        });
    }
});

function transferQueryValue(oResult) {
    if (oResult) {
        Object.keys(oResult).forEach((sColumn) => {
            if (sColumn === "CREATED_ON" || sColumn === "LAST_MODIFIED_ON") {
                oResult[sColumn] = oResult[sColumn].toJSON();
            }  
        })
    } 
}