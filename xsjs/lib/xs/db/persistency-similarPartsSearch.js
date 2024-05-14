const _ = require('lodash');
const helpers = require('../util/helpers');
const MessageLibrary = require('../util/message');
var BusinessObjectTypes = require('../util/constants').BusinessObjectTypes;

const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

let DbArtefactController = require('./generation/hdi-db-artefact-controller').DbArtefactController;
// Calculation Version Tables
var CalculationVersionTables = {
    item: 'sap.plc.db::basis.t_item',
    item_ext: 'sap.plc.db::basis.t_item_ext'
};

// Calculation Version Views with Privileges
var Views = {
    project_with_privileges: 'sap.plc.db.authorization::privileges.v_project_read',
    calculation_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_read',
    calculation_version_with_privileges: 'sap.plc.db.authorization::privileges.v_calculation_version_read'
};

var MaterialPriceTables = {
    material_price: 'sap.plc.db::basis.t_material_price',
    material_price_ext: 'sap.plc.db::basis.t_material_price_ext'
};

var MaterialTables = {
    material: 'sap.plc.db::basis.t_material',
    material_ext: 'sap.plc.db::basis.t_material_ext',
    material__text: 'sap.plc.db::basis.t_material__text'
};

// Supported Master Data Tables
var MasterDataTables = _.extend({}, MaterialPriceTables, MaterialTables);

var Tables = _.extend({ vendor: 'sap.plc.db::basis.t_vendor' }, CalculationVersionTables, MasterDataTables);

// Supported Business Object Types
var SupportedBusinessObjectTypes = _.pick(BusinessObjectTypes, 'Item', 'Material', 'MaterialPrice');

// different fuzzy search parameters for ITEM_DESCRIPTION / MATERIAL_DESCRIPTION and other fields.
const FuzzyParameters = {
    description: "FUZZY(0.6, 'similarCalculationMode=compare,emptyScore=0.0,emptyMatchesNull=true')",
    not_description: "FUZZY(0.0, 'similarCalculationMode=compare,emptyScore=0.0,emptyMatchesNull=true,returnAll=on')",
    text: "FUZZY(0.6, 'textSearch=fulltext')"
};

// The source of search data configured in request.
// 1). For CalculationVersions, it may includes specific projects, calculations, calculation versions, etc.
// 2). For MasterData, it may include specific material types, group, or custom field
// Note: value of source types is lower case because it will be used as variable name in procedure
var SimilarPartsSourceTypes = {
    CalculationVersions: 'calculationversions',
    MasterData: 'masterdata'
};

// The fields that will affect the PRICE
const SimilarPartsPriceCommonFields = [
    'MATERIAL_ID',
    'PRICE_UNIT_UOM_ID',
    'TRANSACTION_CURRENCY_ID',
    'VENDOR_ID',
    'VENDOR_NAME'
];

// Common fields of found items/materials (depends on different data sources)
const SimilarPartsCommonFields = _.union(SimilarPartsPriceCommonFields, [
    'PRICE_UNIT',
    'PRICE_FIXED_PORTION',
    'PRICE_VARIABLE_PORTION'
]);

// metadata columns for similar items/materials
const SimilarPartsMetadata = _.union(SimilarPartsCommonFields, [
    'Source',
    'MATERIAL_DESCRIPTION',
    'ITEM_DESCRIPTION',
    'FREQUENCY',
    'SCORE'
]);

// Price source id for similar parts search
const SimilarPartsPriceSourceId = 'PLC_PROJECT_PRICE';

// When one attribute has more than on value, separate them using " || ";
const MultipleValuesSeparator = ' || ';

// Supported sql types in similar parts search
var SupportedSqlTypes = {
    String: [
        'NVARCHAR',
        'VARCHAR'
    ],
    Numeric: [
        'TINYINT',
        'SMALLINT',
        'INTEGER',
        'BIGINT',
        'DECIMAL',
        'SMALLDECIMAL',
        'REAL',
        'DOUBLE'
    ],
    FixedDecimal: ['FixedDecimal'],
       //for DECIMAL(<precision>, <scale>)
    Boolean: ['BOOLEAN'],
    Date: [
        'DATE',
        'TIMESTAMP',
        'SECONDDATE'
    ],
    Text: [
        'TEXT',
        'SHORTTEXT'
    ]
};

var SupportedScoreFunctions = {
    Linear: 'linear',
    Gaussian: 'gaussian',
    Logarithmic: 'logarithmic'
};

var DefaultScoreFunction = SupportedScoreFunctions.Gaussian;

/**
 * Creates a SimilarPartsSearch object.
 *
 * @param {object} $ - xsjs context
 * @param {object} dbConnection - database connection
 */
function SimilarPartsSearch($, dbConnection) {
    let oDbArtefactController;

    /**
     * Function to search similar items or materials based on input parameter <code>oSearchParameter</code>.
     *
     * The input search parameters <code>oSearchParameter</code> should follow below examples:
     * [
     *  {
     *      "CALCULATION_VERSION_ID": <integer>,
     *      "Attributes": [
     *          {
     *              "Name": <string>,
     *              "Value": <string>,
     *              "Weight": <double>,
     *              "IsFuzzSearch": 0 / 1,
     *              "Pattern": {
     *                  "Value": <string>,
     *                  "Groups": [
     *                      {
     *                          "Index": <integer>,
     *                          "Name": <string>,
     *                          "Weight": <double>,
     *                          "Dict": [
     *                              {
     *                                  "Key": [ <string> ],
     *                                  "Value": <string>
     *                              }
     *                          ]
     *                      }
     *                  ]
     *              },
     *              "Option": {
     *                  "scoreFunction": <string>,
     *                  "scoreFunctionScale": <numeric>,
     *                  "scoreFunctionDecay": <numeric>,
     *                  "scoreFunctionBase": <numeric>,
     *                  "scoreFunctionOffset": <numeric>
     *              }
     * 	        }
     * 	   ],
     *      "Source": {
     *          "MasterData": {
     *              "MaterialTypes": [ <string> ],
     *              "MaterialGroups": [ <string> ]
     *          },
     *          "TimeRange": {
     *              "FromTime": <string>,
     *              "ToTime": <string>
     *          },
     *          "CalculationVersions": {
     *              "OnlyCurrent": 0 / 1,
     *              "ProjectIds": [ <string> ],
     *              "CalculationIds": [ <integer> ],
     *              "CalculationVersions": [ <integer> ],
     *              "ExcludeCalculationVersionIds": [ <integer> ]
     *          }
     *      }
     *  }
     * ]
     *
     * @param {object}
     *              oSearchParameter      - input similar parts search request body.
     * @param {string}
     *              sUserId               - the user id
     * @param {string}
     *              sLanguage             - user session language
     * @param {integer}
     *              iCalculationVersionId - optional parameter, only required when "OnlyCurrent" of CalculationVersions source
     *              in <code>oSearchParameter</code> is marked as 1.
     * @return {array} - found items or/and materials depends on data source
     */
    this.search = async function (oSearchParameter, sUserId, sLanguage, iCalculationVersionId) {
        let sProcedureName;
        oDbArtefactController = await new DbArtefactController($, dbConnection);
        try {
            // Set 'autocommit' to 'off' in one transaction.
            await dbConnection.executeUpdate('SET TRANSACTION AUTOCOMMIT DDL OFF');
            // build search components and create similar parts search procedure
            let oProcedureObject = await buildSearchProcedure(oSearchParameter, sUserId, sLanguage, iCalculationVersionId);

            sProcedureName = oProcedureObject.Name;
            // run generated procedure, and return similar parts
            return await runSearchProcedure(oProcedureObject);
        } finally {
            // drop similar parts search procedure
            if (sProcedureName) {
                oDbArtefactController.hdiDeleteFiles(['src/dynamic/db/' + sProcedureName.split('::')[1] + '.hdbprocedure']);
            }
        }
    };

    /**
     * Build search components (metadata, frequency, data source and attributes),
     * and create similar parts search procedure.
     *
     * @param {object}
     *              oSearchParameter        - similar parts search parameters
     * @param {string}
     *              sUserId                 - the user id
     * @param {string}
     *              sLanguage               - session language
     * @param {integer}
     *              iCalculationVersionId   - optional, only required when OnlyCurrent is 1
     */
    async function buildSearchProcedure(oSearchParameter, sUserId, sLanguage, iCalculationVersionId) {
        // build similar parts search procedure content
        let oProcedureObject = await buildSearchComponents(oSearchParameter, sUserId, sLanguage, iCalculationVersionId);
        // activate procedure content
        let aUpsertList = [{
                PATH: 'src/dynamic/db/' + oProcedureObject.Name.split('::')[1] + '.hdbprocedure',
                CONTENT: oProcedureObject.Statement
            }];
        oDbArtefactController.hdiUpsertFiles(aUpsertList);
        return oProcedureObject;
    }

    /**
     * Load similar search procedure and format results
     *
     * @param {object}
     *              oProcedureObject - basic information of similar search procedure (@see buildSearchComponents), contains:
     *                      "Name": procedure name,
     *                      "Attributes": search attributes includes subfield from field pattern
     */
    async function runSearchProcedure(oProcedureObject) {
        let result;
        try {
            let fnSimilarPartsSearchProcedure = dbConnection.loadProcedure(oProcedureObject.Name);
            result = fnSimilarPartsSearchProcedure();
            result = result.$resultSets.slice(-1)[0];
        } catch (e) {
            const sLogMessage = `Run similar parts search procedure failed: ${ e.message || e.msg }.`;
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        let aSimilarParts = [];
        /**
         * Format procedure result to defined readable response.
         *
         * Procedure Result:
         * |------------------------- Common Fields -------------------|-------------------- Input Attributes --------------|
         * | MATERIAL_ID, FREQUENCY, SCORE, PRICE_VARIABLE_PORTION, ...| ITEM_DESCRIPTION_COUNT, ITEM_DESCRIPTION_SCORE, ...|
         *
         * Defined Response:
         * {
         *     MATERIAL_ID: <string>,
         *     FREQUENCY:   <integer>,
         *     SCROE:       <float>,
         *     PRICE_VARIABLE_PORTION: <float>,
         *     ...
         *     Attributes: [
         *         {
         *            Name: "ITEM_DESCRIPTION",
         *            Value: <string>,      -- from "ITEM_DESCRIPTION_COUNT"
         *            Score: <float>        -- from "ITEM_DESCRIPTION_SCORE"
         *         }
         *     ]
         * }
         */
        for (let i = 0; i < result.length; i++) {
            let oPart = result[i];
            let oSimilarPart = { 'Attributes': [] };
            _.extend(oSimilarPart, _.pickBy(oPart, function (value, key) {
                return _.includes(SimilarPartsMetadata, key);
            }));

            _.each(oProcedureObject.Attributes, function (sAttributeName) {
                oSimilarPart.Attributes.push({
                    'Name': sAttributeName,
                    'Value': oPart[sAttributeName + '_COUNT'],
                    'Score': oPart[sAttributeName + '_SCORE']
                });
            });
            aSimilarParts.push(oSimilarPart);
        }
        return aSimilarParts;
    }

    /**
     * Build similar parts search procedure depending on <code><oSearchParameter/code> and optional <code>iCalculationVersionId</code>
     *
     * Implementation Notes:
     * To support two configured data sources, CalculationVersions and MasterData, construct following
     * components and procedure template.
     * {
     *      Type: CalculationVersions / MasterData
     *      Valid: true for valid data source
     *      Source: statement querying specific calculation versions or master data
     *      Metadata: statement querying price, price currency, price unit, uom, etc.
     *      Frequency: statement querying (item / material) description, and frequency
     *      Score: statement to calculate overview score based on each attribute' score and weight
     *      AttributeStatement: statement of all attributes in select clause
     *      Attributes: [ --- all attributes from input parameters and splitted by pattern
     *          {
     *              Index: index in all attributes
     *              Name: attribute name
     *              FullName: attribute name with source type <SourceType>_<AttrName>, e.g. calculationversions_MATERIAL_ID, to distinguish same column in items and master data tables
     *              Source: attribute comes from calculation versions or master data
     *              Statement: statement querying similar attribute
     *              Metadata: attribute name and score field
     *              Dict: field dictionary and value build statement from input Group.Dict, only for string pattern compare,
     *              Overview: overview of subfields name and score, only for string pattern compare
     *          }
     *      ]
     * }
     *
     * @param {object}
     *              oSearchParameter        - similar parts search parameters
     * @param {string}
     *              sUserId                 - the user id
     * @param {string}
     *              sLanguage               - session language
     * @param {integer}
     *              iCalculationVersionId   - optional, only required when OnlyCurrent is 1
     * @return {object}
     *              oProcedureObject        - includes procedure content and all search attributes
     *
     */
    async function buildSearchComponents(oSearchParameter, sUserId, sLanguage, iCalculationVersionId) {
        let sProcedureName = `sap.plc.db::SEARCH_SIMILAR_PARTS_${ _.now() }`;
        let aSearchComponents = _.keys(SimilarPartsSourceTypes).map(type => {
            return {
                'Type': type.toLowerCase(),
                'Source': oSearchParameter.Source[type],
                'Valid': await isValidDataSource(oSearchParameter.Source[type])
            };
        });

        // If "TimeRange" is not provided, default is no time range limitation on
        // calculation versions or master data.
        await buildDataSourceComponent(sUserId, aSearchComponents, oSearchParameter.Source.TimeRange, iCalculationVersionId);
        await buildMetadataComponent(aSearchComponents, sUserId, sLanguage);
        await buildFrequencyComponent(aSearchComponents);


        let oAttrComponent = await buildAttributeComponents(aSearchComponents, oSearchParameter.Attributes, sLanguage, sUserId);

        await buildScoreComponent(aSearchComponents);

        let sStatement = `
        PROCEDURE "${ sProcedureName }"()
            LANGUAGE SQLSCRIPT
            SQL SECURITY INVOKER
            READS SQL DATA AS
            BEGIN
            -- parse dict statement of attribute pattern
            ${ oAttrComponent.SplittedAttributes.map(oAttr => `
                ${ oAttr.Dict ? `${ oAttr.Dict }` : '' }
            `).filter(s => s.trim().length > 0).join('') }

            -- build kinds of data source statement
            ${ aSearchComponents.map(oComp => `
                ${ oComp.Valid ? `${ oComp.Source };` : '' }
            `).join(' ') }

            -- query fixed, variable price, plant, vendor, etc for data source
            ${ aSearchComponents.map(oComp => `
                ${ oComp.Valid ? `${ oComp.Metadata }` : '' }
            `).join(' ') }

            -- query material id's frequence in data source
            ${ aSearchComponents.map(oComp => `
                ${ oComp.Valid ? `${ oComp.Frequency };` : '' }
            `).join(' ') }

            -- overview statements for attributes supporting string pattern compare
            ${ oAttrComponent.SplittedAttributes.map(oAttr => `
                ${ oAttr.Overview ? `${ oAttr.Overview }` : '' }
            `).filter(s => s.trim().length > 0).join('') }

            -- query each attribute (and splitted attribute) and its score
            ${ aSearchComponents.map(oComp => `
                ${ oComp.Valid ? `${ oComp.Attributes.map(oAttr => `
                    lt_${ oComp.Type }_${ oAttr.Name.toLowerCase() } =
                        ${ oAttr.Statement };
                    SELECT TOP 0 * FROM :lt_${ oComp.Type }_${ oAttr.Name.toLowerCase() };
                `).join(' ') }` : '' }
            `).join(' ') }

            -- join by material id and return similar parts
            (
            ${ aSearchComponents.map(oComp => `
                ${ oComp.Valid ? `
                    SELECT
                        TOP 30
                        (
                            ${ oComp.Score }
                        ) AS SCORE,
                        metadata.*,
                        TO_INT(frequency.FREQUENCY) AS FREQUENCY
                        , ${ oComp.AttributeStatement }
                    FROM
                        :lt_${ oComp.Type }_metadata AS metadata
                    LEFT JOIN
                        :lt_${ oComp.Type }_frequency AS frequency ON metadata.MATERIAL_ID = frequency.MATERIAL_ID
                    ${ oComp.Attributes.length === 0 ? '' : `
                    INNER JOIN
                        ${ oComp.Attributes.map(oAttr => `
                            :lt_${ oComp.Type }_${ oAttr.Name.toLowerCase() } AS T${ oAttr.Index } ON metadata.MATERIAL_ID = T${ oAttr.Index }.MATERIAL_ID
                        `).join(' INNER JOIN ') }
                    ` }
                    ORDER BY SCORE DESC` : '' }
            `).filter(s => s.trim().length > 0).join(') UNION ALL (') }
            );

            END;
        `;

        let oProcedureObject = {
            Statement: sStatement,
            Name: sProcedureName,
            Attributes: oAttrComponent.SearchAttributes
        };
        return oProcedureObject;
    }













    async function buildDataSourceComponent(sUserId, aSearchComponents, oTimeRange, iCalculationVersionId) {
        let oExtTimeRange = { Enabled: false };
        if (!helpers.isNullOrUndefined(oTimeRange)) {
            _.extend(oExtTimeRange, oTimeRange, { Enabled: true });
        }

        _.each(aSearchComponents, async function (oComponent) {
            if (oComponent.Valid) {
                if (oComponent.Type === SimilarPartsSourceTypes.CalculationVersions) {
                    oComponent.Source = await buildCalculationVersionSource(sUserId, oComponent.Source, oExtTimeRange, iCalculationVersionId);
                } else if (oComponent.Type === SimilarPartsSourceTypes.MasterData) {
                    oComponent.Source = await buildMasterDataSource(oComponent.Source, oExtTimeRange);
                }
            }
        });














        async function buildCalculationVersionSource(sUserId, oCalculationVersions, oTimeRange, iCalculationVersionId) {


            if (!helpers.isNullOrUndefined(oCalculationVersions.OnlyCurrent) && oCalculationVersions.OnlyCurrent === 1) {
                return await buildCurrentCalculationVersion(sUserId, iCalculationVersionId);
            }
            return `
            lt_${ SimilarPartsSourceTypes.CalculationVersions }_source =
                SELECT CALCULATION_VERSION_ID
                FROM
                    "${ Views.calculation_version_with_privileges }"
                WHERE
                    USER_ID = '${ sUserId }'
                    ${ oTimeRange.Enabled ? `AND LAST_MODIFIED_ON BETWEEN '${ oTimeRange.FromTime }' AND '${ oTimeRange.ToTime }'` : '' }
                    ${ await isValidChildSource(oCalculationVersions.ProjectIds) ? `AND PROJECT_ID IN ('${ oCalculationVersions.ProjectIds.join("', '") }')` : '' }
                    ${ await isValidChildSource(oCalculationVersions.CalculationIds) ? `AND CALCULATION_ID IN (${ oCalculationVersions.CalculationIds.join(',') })` : '' }
                    ${ await isValidChildSource(oCalculationVersions.CalculationVersionIds) ? `AND CALCULATION_VERSION_ID IN (${ oCalculationVersions.CalculationVersionIds.join(',') })` : '' }
                    ${ await isValidChildSource(oCalculationVersions.ExcludeCalculationVersionIds) ? `AND CALCULATION_VERSION_ID NOT IN (${ oCalculationVersions.ExcludeCalculationVersionIds.join(',') })` : '' }
            `;
        }










        async function buildMasterDataSource(oMasterData, oTimeRange) {
            let sStatement = `
            lt_${ SimilarPartsSourceTypes.MasterData }_source =
                SELECT material.MATERIAL_ID
                FROM
                    "${ Tables.material }" AS material
                WHERE
                    material.MATERIAL_ID IS NOT NULL
                    ${ oTimeRange.Enabled ? `AND material._VALID_FROM BETWEEN '${ oTimeRange.FromTime }' AND '${ oTimeRange.ToTime }'` : '' }
                    ${ await isValidChildSource(oMasterData.MaterialTypes) ? `AND material.MATERIAL_TYPE_ID IN ('${ oMasterData.MaterialTypes.join("', '") }')` : '' }
                    ${ await isValidChildSource(oMasterData.MaterialGroups) ? `AND material.MATERIAL_GROUP_ID IN ('${ oMasterData.MaterialGroups.join("','") }')` : '' }
            `;
            return sStatement;
        }










        function buildCurrentCalculationVersion(sUserId, iCalculationVersionId) {
            return `
            lt_${ SimilarPartsSourceTypes.CalculationVersions }_source =
                SELECT
                    CURRENT_CALCULATION_VERSION_ID AS CALCULATION_VERSION_ID
                FROM
                    "${ Views.calculation_with_privileges }"
                WHERE
                    USER_ID = '${ sUserId }' AND
                    CALCULATION_ID =
                    (
                        SELECT
                            CALCULATION_ID
                        FROM
                            "${ Views.calculation_version_with_privileges }"
                        WHERE
                            USER_ID = '${ sUserId }' AND CALCULATION_VERSION_ID = ${ iCalculationVersionId }
                    )
            `;
        }
    }











    function buildMetadataComponent(aSearchComponents, sUserId, sLanguage) {
        _.each(aSearchComponents, async function (oComponent) {
            if (oComponent.Valid) {
                if (oComponent.Type === SimilarPartsSourceTypes.CalculationVersions) {
                    oComponent.Metadata = await buildCalculationVersionsMetadata();
                } else if (oComponent.Type === SimilarPartsSourceTypes.MasterData) {
                    oComponent.Metadata = await buildMasterDataMetadata();
                }
            }
        });




        function buildCalculationVersionsMetadata() {
            return `
            lt_${ SimilarPartsSourceTypes.CalculationVersions }_base_metadata =
            SELECT
                DISTINCT item.MATERIAL_ID, PRICE_UNIT_UOM_ID, TRANSACTION_CURRENCY_ID, item.VENDOR_ID, vendor.VENDOR_NAME,
                PRICE_UNIT, PRICE_FIXED_PORTION, PRICE_VARIABLE_PORTION, ITEM_DESCRIPTION
            FROM
                "${ Tables.item }" AS item
            INNER JOIN
                :lt_${ SimilarPartsSourceTypes.CalculationVersions }_source AS source
                ON item.CALCULATION_VERSION_ID = source.CALCULATION_VERSION_ID
            INNER JOIN
                "${ Views.calculation_version_with_privileges }" AS calcVer
                ON item.CALCULATION_VERSION_ID = calcVer.CALCULATION_VERSION_ID
                AND calcVer.USER_ID = '${ sUserId }'
            LEFT OUTER JOIN
                "${ Tables.vendor }" AS vendor
                ON item.VENDOR_ID = vendor.VENDOR_ID
                AND calcVer.MASTER_DATA_TIMESTAMP >= vendor._VALID_FROM
                AND (vendor._VALID_TO IS NULL OR calcVer.MASTER_DATA_TIMESTAMP < vendor._VALID_TO)
            WHERE item.MATERIAL_ID IS NOT NULL;

            lt_${ SimilarPartsSourceTypes.CalculationVersions }_metadata =
                SELECT
                    'CalculationVersions' AS "Source", item.*, itemd.ITEM_DESCRIPTION, MATERIAL_DESCRIPTION
                FROM
                (
                    SELECT
                        ${ SimilarPartsPriceCommonFields.join(', ') }, MIN(PRICE_UNIT) AS PRICE_UNIT,
                        AVG(PRICE_VARIABLE_PORTION / PRICE_UNIT) * MIN(PRICE_UNIT) AS PRICE_VARIABLE_PORTION,
                        AVG(PRICE_FIXED_PORTION / PRICE_UNIT) * MIN(PRICE_UNIT) AS PRICE_FIXED_PORTION
                    FROM
                        :lt_${ SimilarPartsSourceTypes.CalculationVersions }_base_metadata
                    GROUP BY ${ SimilarPartsPriceCommonFields.join(', ') }
                ) AS item
                INNER JOIN
                (
                    SELECT ${ SimilarPartsPriceCommonFields.join(', ') },
                        STRING_AGG(ITEM_DESCRIPTION, '${ MultipleValuesSeparator }') AS ITEM_DESCRIPTION
                    FROM
                        :lt_${ SimilarPartsSourceTypes.CalculationVersions }_base_metadata
                    GROUP BY ${ SimilarPartsPriceCommonFields.join(', ') }
                ) AS itemd
                    ON item.MATERIAL_ID = itemd.MATERIAL_ID
                    AND item.PRICE_UNIT_UOM_ID = itemd.PRICE_UNIT_UOM_ID
                    AND item.TRANSACTION_CURRENCY_ID = itemd.TRANSACTION_CURRENCY_ID
                    AND item.VENDOR_ID = itemd.VENDOR_ID
                LEFT JOIN
                    "${ Tables.material__text }" AS material__text
                    ON item.MATERIAL_ID = material__text.MATERIAL_ID
                    AND material__text.LANGUAGE = '${ sLanguage }';
            `;
        }




        function buildMasterDataMetadata() {
            return `
            lt_${ SimilarPartsSourceTypes.MasterData }_metadata =
                SELECT
                    'MasterData' AS "Source", source.MATERIAL_ID, PRICE_UNIT_UOM_ID, TRANSACTION_CURRENCY_ID,
                    price.VENDOR_ID, vendor.VENDOR_NAME, MIN(PRICE_UNIT) AS PRICE_UNIT,
                    AVG(PRICE_VARIABLE_PORTION / PRICE_UNIT) * MIN(PRICE_UNIT) AS PRICE_VARIABLE_PORTION,
                    AVG(PRICE_FIXED_PORTION / PRICE_UNIT) * MIN(PRICE_UNIT) AS PRICE_FIXED_PORTION,
                    NULL AS ITEM_DESCRIPTION, MATERIAL_DESCRIPTION
                FROM
                    :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                INNER JOIN
                    "${ Tables.material_price }" AS price
                    ON source.MATERIAL_ID = price.MATERIAL_ID
                    AND price.PRICE_SOURCE_ID = '${ SimilarPartsPriceSourceId }'
                    AND price.PROJECT_ID IN (
                        SELECT PROJECT_ID
                        FROM "${ Views.project_with_privileges }"
                        WHERE USER_ID = '${ sUserId }'
                    )
                LEFT JOIN
                    "${ Tables.vendor }" AS vendor
                    ON price.VENDOR_ID = vendor.VENDOR_ID
                    AND price._VALID_FROM >= vendor._VALID_FROM
                    AND (vendor._VALID_TO IS NULL OR price._VALID_FROM < vendor._VALID_TO)
                LEFT JOIN
                    "${ Tables.material__text }" AS material__text
                    ON source.MATERIAL_ID = material__text.MATERIAL_ID
                    AND material__text.LANGUAGE = '${ sLanguage }'
                GROUP BY
                    source.MATERIAL_ID, PRICE_UNIT_UOM_ID, TRANSACTION_CURRENCY_ID, price.VENDOR_ID, vendor.VENDOR_NAME, MATERIAL_DESCRIPTION
                ;`;
        }
    }







    function buildFrequencyComponent(aSearchComponents) {
        _.each(aSearchComponents, async function (oComponent) {
            if (oComponent.Valid) {
                if (oComponent.Type === SimilarPartsSourceTypes.CalculationVersions) {
                    oComponent.Frequency = await buildCalculationVersionsFrequency();
                } else if (oComponent.Type === SimilarPartsSourceTypes.MasterData) {
                    oComponent.Frequency = await buildMasterDataFrequency();
                }
            }
        });




        function buildCalculationVersionsFrequency() {
            return `
            lt_${ SimilarPartsSourceTypes.CalculationVersions }_frequency =
                SELECT
                    MATERIAL_ID, COUNT(1) AS FREQUENCY
                FROM
                    (
                        SELECT
                            DISTINCT item.MATERIAL_ID, item.CALCULATION_VERSION_ID 
                        FROM
                            "${ Tables.item }" AS item,
                            :lt_${ SimilarPartsSourceTypes.CalculationVersions }_source AS source
                        WHERE
                            item.CALCULATION_VERSION_ID = source.CALCULATION_VERSION_ID
                            AND item.MATERIAL_ID IS NOT NULL
                    )
                GROUP BY MATERIAL_ID
            `;
        }




        function buildMasterDataFrequency() {
            return `
            lt_${ SimilarPartsSourceTypes.MasterData }_frequency =
                SELECT
                    DISTINCT material.MATERIAL_ID, 1 AS FREQUENCY
                FROM
                    "${ Tables.material }" AS material,
                    :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                WHERE
                    material.MATERIAL_ID = source.MATERIAL_ID
                    AND material.MATERIAL_ID IS NOT NULL
            `;
        }
    }













    async function buildAttributeComponents(aSearchComponents, aAttributes, sLanguage, sUserId) {

        let aTempNewAttributes = [];
        _.each(aAttributes, function (oAttr) {



            _.each(oAttr.PropertyMap, function (oColumnProp) {
                aTempNewAttributes.push(_.extend({}, _.omit(oAttr, 'PropertyMap'), oColumnProp));
            });
        });


        let aNewAttributes = [];
        let iAttributeIndex = 0;
        let aSplittedAttributeNames = [];

        let aSearchAttributes = [];
        _.each(aTempNewAttributes, async function (oAttribute) {



            let sSourceType = oAttribute.SourceType;
            if (_.find(aSearchComponents, function (oComp) {
                    return oComp.Type === sSourceType;
                }).Valid) {
                let aParsedResults = await buildAttributeComponent(oAttribute, sSourceType);
                let aParsedAttributeNames = _.map(aParsedResults, 'FullName');
                if (oAttribute.IsFuzzySearch === 0) {
                    aSplittedAttributeNames = _.union(aSplittedAttributeNames, aParsedAttributeNames);
                }
                aSearchAttributes = _.union(aSearchAttributes, _.map(aParsedResults, 'Name'));
                _.each(aParsedResults, function (oResult) {
                    oResult.Metadata = `T${ iAttributeIndex }.${ oResult.Name }_COUNT, ${ oResult.Name }_SCORE`;
                    oResult.Index = iAttributeIndex++;
                    oResult.Source = sSourceType;
                    aNewAttributes.push(oResult);
                });
            }
        });
        if (aNewAttributes.length === 0) {
            const sLogMessage = 'No attribute name match with input data source.';
            $.trace.error(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        let aSplittedAttributes = aSplittedAttributeNames.map(sSplittedName => {
            return _.find(aNewAttributes, function (oAttr) {
                return oAttr.FullName === sSplittedName;
            });
        });


        _.each(aSearchComponents, function (oComponent) {
            let aPartitionAttrs = _.partition(aNewAttributes, function (oNewAttr) {
                return oComponent.Type === oNewAttr.Source;
            });
            oComponent.Attributes = aPartitionAttrs[0];
            oComponent.AttributeStatement = aSearchAttributes.map(oAttrName => {
                let oExistAttr = oComponent.Attributes.find(oAttr => {
                    return oAttr.Name === oAttrName;
                });
                if (oExistAttr === undefined) {
                    return `NULL AS ${ oAttrName }_COUNT, 0 AS ${ oAttrName }_SCORE`;
                } else {
                    return oExistAttr.Metadata;
                }
            }).join(', ');
        });
        return {
            SplittedAttributes: aSplittedAttributes,
            SearchAttributes: aSearchAttributes
        };









        async function buildAttributeComponent(oAttribute, sSourceType) {
            if (sSourceType === SimilarPartsSourceTypes.MasterData) {
                if (oAttribute.IsFuzzySearch === 1) {
                    return await buildFuzzySearchForMasterData(oAttribute);
                } else {
                    return await buildStringPatternCompareForMasterData(oAttribute);
                }
            } else if (sSourceType === SimilarPartsSourceTypes.CalculationVersions) {
                if (oAttribute.IsFuzzySearch === 1) {
                    return await buildFuzzySearchForCalculationVersions(oAttribute);
                } else {
                    return await buildStringPatternCompareForCalculationVersions(oAttribute);
                }
            }
        }











        async function buildFixedDecimalFuzzyScore(oAttribute) {
            if (oAttribute.Option.scoreFunction === SupportedScoreFunctions.Linear) {
                let slope = (1 - oAttribute.Option.scoreFunctionDecay) / oAttribute.Option.scoreFunctionScale;
                let h = await max(0, `ABS(${ oAttribute.Name } - ${ oAttribute.Value }) - ${ oAttribute.Option.scoreFunctionOffset }`);
                return await max(`1 - ${ slope } * ${ h }`, 0);
            } else if (oAttribute.Option.scoreFunction === SupportedScoreFunctions.Gaussian) {
                let variance = -Math.pow(oAttribute.Option.scoreFunctionScale, 2) / (2 * await Math.log(oAttribute.Option.scoreFunctionDecay));
                let h = await max(0, `ABS(${ oAttribute.Name } - ${ oAttribute.Value }) - ${ oAttribute.Option.scoreFunctionOffset }`);
                return `POWER(${ Math.E }, - POWER(${ h }, 2) / (2 * (${ variance })))`;
            } else if (oAttribute.Option.scoreFunction === SupportedScoreFunctions.Logarithmic) {
                if (oAttribute.Option.scoreFunctionBase <= 1) {
                    return `CASE WHEN ${ oAttribute.Name } >= ${ oAttribute.Value } - ${ oAttribute.Option.scoreFunctionOffset } THEN 1 ELSE 0 END`;
                } else {
                    let factor = `(${ oAttribute.Option.scoreFunctionBase } - 1) / (${ oAttribute.Value } - ${ oAttribute.Option.scoreFunctionOffset })`;
                    return `CASE WHEN ${ oAttribute.Name } <= 0 THEN 0
                            WHEN ${ oAttribute.Value } = ${ oAttribute.Option.scoreFunctionOffset } THEN 1
                            WHEN ${ oAttribute.Name } > ${ oAttribute.Value } - ${ oAttribute.Option.scoreFunctionOffset } THEN 1
                            ELSE LOG(${ oAttribute.Option.scoreFunctionBase }, 1 + ${ factor } * ${ oAttribute.Name }) END`;
                }
            }

            function max(val1, val2) {
                return `0.5 * (((${ val1 }) + (${ val2 })) + ABS((${ val1 }) - (${ val2 })))`;
            }
        }














        async function buildFuzzyScore(sDataType, oAttribute) {
            if (_.includes(SupportedSqlTypes.String, sDataType)) {
                return 'SCORE()';
            } else if (_.includes(SupportedSqlTypes.Numeric, sDataType)) {
                return 'SCORE()';
            } else if (_.includes(SupportedSqlTypes.FixedDecimal, sDataType)) {
                return await buildFixedDecimalFuzzyScore(oAttribute);
            } else if (_.includes(SupportedSqlTypes.Date, sDataType)) {
                return `SCORE()`;
            } else if (_.includes(SupportedSqlTypes.Boolean, sDataType)) {
                let sValue = oAttribute.Value.toString().toUpperCase();
                sValue = sValue === '1' || sValue === 'TRUE' ? 'TRUE' : 'FALSE';
                return `CASE WHEN ${ sValue } = ${ oAttribute.Name } THEN 1 ELSE 0 END`;
            } else if (_.includes(SupportedSqlTypes.Text, sDataType)) {
                return 'SCORE()';
            }
        }








        function buildFuzzySearchOptions(oOption) {
            if (oOption.scoreFunction === SupportedScoreFunctions.Logarithmic) {
                return `FUZZY(0.01, 'scoreFunction=logarithmic,scoreFunctionBase=${ oOption.scoreFunctionBase },scoreFunctionOffset=${ oOption.scoreFunctionOffset }')`;
            } else {
                return `FUZZY(0.01, 'scoreFunction=${ oOption.scoreFunction },scoreFunctionScale=${ oOption.scoreFunctionScale },scoreFunctionDecay=${ oOption.scoreFunctionDecay },scoreFunctionOffset=${ oOption.scoreFunctionOffset }')`;
            }
        }














        async function buildFuzzyContains(sDataType, oAttribute) {
            if (_.includes(SupportedSqlTypes.String, sDataType)) {
                if (oAttribute.SourceType === SimilarPartsSourceTypes.CalculationVersions) {

                    let bIsItemDescription = oAttribute.Name === 'ITEM_DESCRIPTION';
                    return `CONTAINS(${ oAttribute.Name }, '${ oAttribute.Value }', ${ bIsItemDescription ? `${ FuzzyParameters.description }` : `${ FuzzyParameters.not_description }` })`;
                } else if (oAttribute.SourceType === SimilarPartsSourceTypes.MasterData) {
                    let bIsMaterialId = oAttribute.Name === 'MATERIAL_ID';

                    let bIsMaterailDescription = oAttribute.Name === 'MATERIAL_DESCRIPTION';
                    return `CONTAINS(${ bIsMaterialId ? 'material.' : '' }${ oAttribute.Name }, '${ oAttribute.Value }', ${ bIsMaterailDescription ? `${ FuzzyParameters.description }` : `${ FuzzyParameters.not_description }` })`;
                }
            } else if (_.includes(SupportedSqlTypes.Numeric, sDataType)) {
                return `CONTAINS(${ oAttribute.Name }, ${ oAttribute.Value }, ${ await buildFuzzySearchOptions(oAttribute.Option) })`;
            } else if (_.includes(SupportedSqlTypes.FixedDecimal, sDataType)) {
                return '1 = 1';
            } else if (_.includes(SupportedSqlTypes.Date, sDataType)) {
                return `CONTAINS(${ oAttribute.Name }, '${ oAttribute.Value }', ${ await buildFuzzySearchOptions(oAttribute.Option) })`;
            } else if (_.includes(SupportedSqlTypes.Boolean, sDataType)) {
                return '1 = 1';
            } else if (_.includes(SupportedSqlTypes.Text, sDataType)) {
                return `CONTAINS(${ oAttribute.Name }, '${ oAttribute.Value }', ${ FuzzyParameters.text })`;
            }
        }







        function buildAttributeName(oAttribute) {
            return oAttribute.Name === 'MATERIAL_ID' ? '' : `, ${ oAttribute.Name }`;
        }









        function buildCastAttributeName(oAttribute) {
            if (oAttribute.Name === 'MATERIAL_ID') {
                return '';
            } else if (_.includes(SupportedSqlTypes.Text, oAttribute.DataType)) {
                return `, LEFT(${ oAttribute.Name }, 5000) AS ${ oAttribute.Name }`;
            } else {
                return `, ${ oAttribute.Name }`;
            }
        }











        async function buildFuzzySearchForCalculationVersions(oAttribute) {

            let sAttributeName = await buildAttributeName(oAttribute);
            let sJoinSourceClause = await buildJoinClause(SimilarPartsSourceTypes.CalculationVersions);

            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.Item).IS_CUSTOM;
            let sStatement = `
                SELECT MATERIAL_ID,
                    STRING_AGG(TO_NVARCHAR(${ oAttribute.Name }) || ' (' || ${ oAttribute.Name }_FREQUENCY || ')', '${ MultipleValuesSeparator }') AS ${ oAttribute.Name }_COUNT,
                    IFNULL(SUM(${ oAttribute.Name }_SCORE * ${ oAttribute.Name }_FREQUENCY) / SUM(${ oAttribute.Name }_FREQUENCY), 0) AS ${ oAttribute.Name }_SCORE
                FROM
                (
                    SELECT MATERIAL_ID${ sAttributeName }, COUNT(1) AS ${ oAttribute.Name }_FREQUENCY,
                        AVG(${ oAttribute.Name }_SCORE) AS ${ oAttribute.Name }_SCORE
                    FROM
                        (
                            SELECT
                                DISTINCT item.CALCULATION_VERSION_ID, item.MATERIAL_ID${ await buildCastAttributeName(oAttribute) }, ${ await buildFuzzyScore(oAttribute.DataType, oAttribute) } AS ${ oAttribute.Name }_SCORE
                            FROM
                                :lt_${ SimilarPartsSourceTypes.CalculationVersions }_source AS source,
                                "${ Tables.item }" AS item
                                ${ bIsCustomField ? `, "${ Tables.item_ext }" AS item_ext` : '' }
                            WHERE
                                ${ sJoinSourceClause }
                                ${ bIsCustomField ? `AND item.CALCULATION_VERSION_ID = item_ext.CALCULATION_VERSION_ID
                                AND item.ITEM_ID = item_ext.ITEM_ID` : '' }
                                AND item.MATERIAL_ID IS NOT NULL
                                AND ${ await buildFuzzyContains(oAttribute.DataType, oAttribute) }
                        )
                    GROUP BY
                        MATERIAL_ID${ sAttributeName }
                )
                GROUP BY MATERIAL_ID
                `;
            return [{
                    Name: oAttribute.Name,
                    FullName: `${ SimilarPartsSourceTypes.CalculationVersions }_${ oAttribute.Name }`,
                    Weight: oAttribute.Weight,
                    Statement: sStatement
                }];
        }











        async function buildStringPatternCompareForCalculationVersions(oAttribute) {
            let sFieldPattern = oAttribute.Pattern.Value;
            let aGroupStmts = [];
            for (let i = 0; i < oAttribute.Pattern.Groups.length; i++) {
                let oGroup = oAttribute.Pattern.Groups[i];
                let sSubFieldName = oGroup.Name;
                let sDict = await buildDictionary(oGroup, sFieldPattern, oAttribute.Value);
                let sStatement = `
                SELECT MATERIAL_ID,
                    STRING_AGG(${ sSubFieldName } || ' (' || ${ sSubFieldName }_FREQUENCY || ')', '${ MultipleValuesSeparator }') AS ${ sSubFieldName }_COUNT,
                    TO_INT(CEIL(AVG(${ sSubFieldName }_SCORE))) AS ${ sSubFieldName }_SCORE
                FROM (
                    SELECT
                        MATERIAL_ID, ${ sSubFieldName }, COUNT(1) AS ${ sSubFieldName }_FREQUENCY,
                        AVG(${ sSubFieldName }_SCORE) AS ${ sSubFieldName }_SCORE
                    FROM
                        :lt_${ SimilarPartsSourceTypes.CalculationVersions }_${ oAttribute.Name.toLowerCase() }
                    GROUP BY MATERIAL_ID, ${ sSubFieldName }
                ) GROUP BY MATERIAL_ID
                `;

                aGroupStmts.push({
                    Name: sSubFieldName,
                    FullName: `${ SimilarPartsSourceTypes.CalculationVersions }_${ sSubFieldName }`,
                    Weight: oGroup.Weight,
                    Statement: sStatement,
                    Dict: sDict
                });
            }


            aGroupStmts[0].Overview = await buildOverviewStringPatternForCalculationVersions(oAttribute);
            return aGroupStmts;
        }








        async function buildOverviewStringPatternForCalculationVersions(oAttribute) {
            let sFieldPattern = oAttribute.Pattern.Value;
            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.Item).IS_CUSTOM;
            let sJoinSourceClause = await buildJoinClause(SimilarPartsSourceTypes.CalculationVersions);
            let aSubFieldKeys = new RegExp(oAttribute.Pattern.Value).exec(oAttribute.Value);
            let aSubFields = oAttribute.Pattern.Groups.map(oGroup => {
                let sSubFieldValue = _.find(oGroup.Dict, function (dict) {
                    return _.includes(dict.Key, aSubFieldKeys[oGroup.Index]);
                }).Value;
                return {
                    Name: oGroup.Name,
                    Value: sSubFieldValue,
                    Index: oGroup.Index
                };
            });
            let sOverviewStatement = `lt_${ SimilarPartsSourceTypes.CalculationVersions }_${ oAttribute.Name.toLowerCase() }  =
                SELECT
                    DISTINCT item.CALCULATION_VERSION_ID, item.MATERIAL_ID,
                    ${ aSubFields.map(oField => `
                        dict${ oField.Index }.${ oField.Name }_DESCRIPTION AS ${ oField.Name },
                        CASE WHEN
                            dict${ oField.Index }.${ oField.Name }_DESCRIPTION = '${ oField.Value }' THEN 1.0
                            ELSE 0.0
                        END AS ${ oField.Name }_SCORE`).join(', ') }
                FROM
                    :lt_${ SimilarPartsSourceTypes.CalculationVersions }_source AS source,
                    ${ aSubFields.map(oField => `
                        :lt_${ oField.Name.toLowerCase() }_dict AS dict${ oField.Index }`).join(', ') },
                    "${ Tables.item }" AS item
                    ${ bIsCustomField ? `, "${ Tables.item_ext }" AS item_ext` : '' }
                WHERE
                    ${ sJoinSourceClause }
                    ${ bIsCustomField ? `AND item.CALCULATION_VERSION_ID = item_ext.CALCULATION_VERSION_ID
                    AND item.ITEM_ID = item_ext.ITEM_ID` : '' }
                    AND ${ oAttribute.Name } LIKE_REGEXPR '${ sFieldPattern }'
                    AND ${ aSubFields.map(oField => `
                        dict${ oField.Index }.${ oField.Name } = SUBSTRING_REGEXPR('${ sFieldPattern }' IN ${ oAttribute.Name } GROUP ${ oField.Index })
                    `).join(' AND ') };`;
            return sOverviewStatement;
        }







        async function buildFuzzySearchForMasterData(oAttribute) {
            if (oAttribute.Name === 'MATERIAL_ID' || !_.isEmpty(_.intersection(_.values(MaterialTables), oAttribute.TableSource))) {
                return await buildFuzzySearchForMaterials(oAttribute);
            } else {
                return await buildFuzzySearchForMaterialPrices(oAttribute);
            }
        }







        async function buildFuzzySearchForMaterials(oAttribute) {
            let sAttributeName = await buildAttributeName(oAttribute);
            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.Material).IS_CUSTOM;
            let sStatement = `
            SELECT
                MATERIAL_ID,
                STRING_AGG(TO_NVARCHAR(${ oAttribute.Name }) || ' (' || ${ oAttribute.Name }_FREQUENCY || ')', '${ MultipleValuesSeparator }') AS ${ oAttribute.Name }_COUNT,
                SUM(${ oAttribute.Name }_SCORE * ${ oAttribute.Name }_FREQUENCY) / SUM(${ oAttribute.Name }_FREQUENCY) AS ${ oAttribute.Name }_SCORE
            FROM
            (
                SELECT MATERIAL_ID ${ sAttributeName }, COUNT(1) AS ${ oAttribute.Name }_FREQUENCY, AVG(${ oAttribute.Name }_SCORE) AS ${ oAttribute.Name }_SCORE
                FROM
                (
                    SELECT
                        material.MATERIAL_ID ${ await buildCastAttributeName(oAttribute) }, ${ await buildFuzzyScore(oAttribute.DataType, oAttribute) } AS ${ oAttribute.Name }_SCORE
                    FROM
                        "${ Tables.material }" AS material
                    INNER JOIN :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                        ON material.MATERIAL_ID = source.MATERIAL_ID
                    ${ bIsCustomField ? `INNER JOIN "${ Tables.material_ext }" AS material_ext
                        ON material.MATERIAL_ID = material_ext.MATERIAL_ID
                        AND material._VALID_FROM = material_ext._VALID_FROM` : '' }
                    LEFT JOIN "${ Tables.material__text }" AS material__text
                        ON material.MATERIAL_ID = material__text.MATERIAL_ID
                        AND material__text.LANGUAGE = '${ sLanguage }'
                    WHERE
                        ${ await buildFuzzyContains(oAttribute.DataType, oAttribute) }
                )
                GROUP BY MATERIAL_ID ${ sAttributeName }
            ) GROUP BY MATERIAL_ID
            `;
            return [{
                    Name: oAttribute.Name,
                    FullName: `${ SimilarPartsSourceTypes.MasterData }_${ oAttribute.Name }`,
                    Weight: oAttribute.Weight,
                    Statement: sStatement
                }];
        }







        async function buildFuzzySearchForMaterialPrices(oAttribute) {
            let sAttributeName = await buildAttributeName(oAttribute);
            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.MaterialPrice).IS_CUSTOM;
            let sStatement = `
            SELECT
                MATERIAL_ID,
                STRING_AGG(TO_NVARCHAR(${ oAttribute.Name }) || ' (' || ${ oAttribute.Name }_FREQUENCY || ')', '${ MultipleValuesSeparator }') AS ${ oAttribute.Name }_COUNT,
                SUM(${ oAttribute.Name }_SCORE * ${ oAttribute.Name }_FREQUENCY) / SUM(${ oAttribute.Name }_FREQUENCY) AS ${ oAttribute.Name }_SCORE
            FROM
            (
                SELECT MATERIAL_ID ${ sAttributeName }, COUNT(1) AS ${ oAttribute.Name }_FREQUENCY, AVG(${ oAttribute.Name }_SCORE) AS ${ oAttribute.Name }_SCORE
                FROM
                (
                    SELECT
                        plcTable.MATERIAL_ID ${ await buildCastAttributeName(oAttribute) }, ${ await buildFuzzyScore(oAttribute.DataType, oAttribute) } AS ${ oAttribute.Name }_SCORE
                    FROM
                        "${ Tables.material_price }" AS plcTable
                    INNER JOIN :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                        ON plcTable.MATERIAL_ID = source.MATERIAL_ID
                        AND plcTable.PRICE_SOURCE_ID = '${ SimilarPartsPriceSourceId }'
                        AND plcTable.PROJECT_ID IN (
                            SELECT PROJECT_ID
                            FROM "${ Views.project_with_privileges }"
                            WHERE USER_ID = '${ sUserId }'
                        )
                    ${ bIsCustomField ? `INNER JOIN "${ Tables.material_price_ext }" AS plcExtTable
                        ON plcTable.PRICE_ID = plcExtTable.PRICE_ID                        
                        AND plcTable._VALID_FROM = plcExtTable._VALID_FROM` : '' }
                    WHERE
                        ${ await buildFuzzyContains(oAttribute.DataType, oAttribute) }
                )
                GROUP BY MATERIAL_ID ${ sAttributeName }
            ) GROUP BY MATERIAL_ID
            `;
            return [{
                    Name: oAttribute.Name,
                    FullName: `${ SimilarPartsSourceTypes.MasterData }_${ oAttribute.Name }`,
                    Weight: oAttribute.Weight,
                    Statement: sStatement
                }];
        }







        async function buildStringPatternCompareForMasterData(oAttribute) {
            let sFieldPattern = oAttribute.Pattern.Value;
            let aGroupStmts = [];
            for (let i = 0; i < oAttribute.Pattern.Groups.length; i++) {
                let oGroup = oAttribute.Pattern.Groups[i];
                let sSubFieldName = oGroup.Name;
                let sDict = await buildDictionary(oGroup, sFieldPattern, oAttribute.Value);
                let sStatement = `
                SELECT MATERIAL_ID,
                    STRING_AGG(${ sSubFieldName } || ' (' || ${ sSubFieldName }_FREQUENCY || ')', '${ MultipleValuesSeparator }') AS ${ sSubFieldName }_COUNT,
                    TO_INT(CEIL(AVG(${ sSubFieldName }_SCORE))) AS ${ sSubFieldName }_SCORE
                FROM (
                    SELECT
                        MATERIAL_ID, ${ sSubFieldName }, COUNT(1) AS ${ sSubFieldName }_FREQUENCY,
                        AVG(${ sSubFieldName }_SCORE) AS ${ sSubFieldName }_SCORE
                    FROM
                        :lt_${ SimilarPartsSourceTypes.MasterData }_${ oAttribute.Name.toLowerCase() }
                    GROUP BY MATERIAL_ID, ${ sSubFieldName }
                ) GROUP BY MATERIAL_ID
                `;
                aGroupStmts.push({
                    Name: sSubFieldName,
                    FullName: `${ SimilarPartsSourceTypes.MasterData }_${ sSubFieldName }`,
                    Weight: oGroup.Weight,
                    Statement: sStatement,
                    Dict: sDict
                });
            }


            aGroupStmts[0].Overview = await buildOverviewStringPatternForMasterData(oAttribute);
            return aGroupStmts;
        }








        async function buildOverviewStringPatternForMasterData(oAttribute) {
            if (oAttribute.Name === 'MATERIAL_ID' || !_.isEmpty(_.intersection(_.values(MaterialTables), oAttribute.TableSource))) {
                return await buildOverviewStringPatternForMaterials(oAttribute);
            } else {
                return await buildOverviewStringPatternForMaterialPrices(oAttribute);
            }
        }








        function buildOverviewStringPatternForMaterials(oAttribute) {
            let sFieldPattern = oAttribute.Pattern.Value;
            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.Material).IS_CUSTOM;
            let aSubFieldKeys = new RegExp(oAttribute.Pattern.Value).exec(oAttribute.Value);
            let aSubFields = oAttribute.Pattern.Groups.map(oGroup => {
                let sSubFieldValue = _.find(oGroup.Dict, function (dict) {
                    return _.includes(dict.Key, aSubFieldKeys[oGroup.Index]);
                }).Value;
                return {
                    Name: oGroup.Name,
                    Value: sSubFieldValue,
                    Index: oGroup.Index
                };
            });
            let sOverviewStatement = `lt_${ SimilarPartsSourceTypes.MasterData }_${ oAttribute.Name.toLowerCase() }  =
                SELECT
                    DISTINCT material.MATERIAL_ID,
                    ${ aSubFields.map(oField => `
                        dict${ oField.Index }.${ oField.Name }_DESCRIPTION AS ${ oField.Name },
                        CASE WHEN
                            dict${ oField.Index }.${ oField.Name }_DESCRIPTION = '${ oField.Value }' THEN 1.0
                            ELSE 0.0
                        END AS ${ oField.Name }_SCORE`).join(', ') }
                FROM
                    "${ Tables.material }" AS material
                INNER JOIN :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                    ON material.MATERIAL_ID = source.MATERIAL_ID
                ${ bIsCustomField ? `INNER JOIN "${ Tables.material_ext }" AS material_ext
                    ON material.MATERIAL_ID = material_ext.MATERIAL_ID
                    AND material._VALID_FROM = material_ext._VALID_FROM` : '' }
                ${ aSubFields.map(oField => `
                LEFT JOIN :lt_${ oField.Name.toLowerCase() }_dict AS dict${ oField.Index }
                    ON dict${ oField.Index }.${ oField.Name } = SUBSTRING_REGEXPR('${ sFieldPattern }' IN ${ oAttribute.Name } GROUP ${ oField.Index })`).join(' ') }
                LEFT JOIN "${ Tables.material__text }" AS material__text
                    ON material.MATERIAL_ID = material__text.MATERIAL_ID
                WHERE
                    ${ oAttribute.Name } LIKE_REGEXPR '${ sFieldPattern }';`;
            return sOverviewStatement;
        }








        function buildOverviewStringPatternForMaterialPrices(oAttribute) {
            let sFieldPattern = oAttribute.Pattern.Value;
            let bIsCustomField = _.find(oAttribute.Metadata, oMetadata => oMetadata.BUSINESS_OBJECT === SupportedBusinessObjectTypes.MaterialPrice).IS_CUSTOM;
            let aSubFieldKeys = new RegExp(oAttribute.Pattern.Value).exec(oAttribute.Value);
            let aSubFields = oAttribute.Pattern.Groups.map(oGroup => {
                let sSubFieldValue = _.find(oGroup.Dict, function (dict) {
                    return _.includes(dict.Key, aSubFieldKeys[oGroup.Index]);
                }).Value;
                return {
                    Name: oGroup.Name,
                    Value: sSubFieldValue,
                    Index: oGroup.Index
                };
            });
            let sOverviewStatement = `lt_${ SimilarPartsSourceTypes.MasterData }_${ oAttribute.Name.toLowerCase() } =
                SELECT
                    DISTINCT plcTable.MATERIAL_ID,
                    ${ aSubFields.map(oField => `
                        dict${ oField.Index }.${ oField.Name }_DESCRIPTION AS ${ oField.Name },
                        CASE WHEN
                            dict${ oField.Index }.${ oField.Name }_DESCRIPTION = '${ oField.Value }' THEN 1.0
                            ELSE 0.0
                        END AS ${ oField.Name }_SCORE`).join(', ') }
                FROM
                    "${ Tables.material_price }" AS plcTable
                INNER JOIN :lt_${ SimilarPartsSourceTypes.MasterData }_source AS source
                    ON plcTable.MATERIAL_ID = source.MATERIAL_ID
                    AND plcTable.PRICE_SOURCE_ID = '${ SimilarPartsPriceSourceId }'
                    AND plcTable.PROJECT_ID IN (
                        SELECT PROJECT_ID
                        FROM "${ Views.project_with_privileges }"
                        WHERE USER_ID = '${ sUserId }'
                    )
                ${ bIsCustomField ? `INNER JOIN "${ Tables.material_price_ext }" AS plcExtTable
                    ON plcTable.PRICE_ID = plcExtTable.PRICE_ID
                    AND plcTable._VALID_FROM = plcExtTable._VALID_FROM` : '' }
                ${ aSubFields.map(oField => `
                    LEFT JOIN :lt_${ oField.Name.toLowerCase() }_dict AS dict${ oField.Index }
                        ON dict${ oField.Index }.${ oField.Name } = SUBSTRING_REGEXPR('${ sFieldPattern }' IN ${ oAttribute.Name } GROUP ${ oField.Index })`).join(' ') }
                WHERE
                    ${ oAttribute.Name } LIKE_REGEXPR '${ sFieldPattern }';`;
            return sOverviewStatement;
        }








        function buildDictionary(oGroup) {
            let sSubFieldName = oGroup.Name;
            let aPairStatements = [];
            _.each(oGroup.Dict, function (oDict) {
                _.each(oDict.Key, function (sKey) {
                    aPairStatements.push(`SELECT '${ sKey }' AS ${ sSubFieldName }, '${ oDict.Value }' AS ${ sSubFieldName }_DESCRIPTION FROM "sap.plc.db::DUMMY"`);
                });
            });
            let sDictStatement = aPairStatements.join('\n UNION ALL \n');
            return `lt_${ sSubFieldName.toLowerCase() }_dict = ${ sDictStatement };`;
        }







        function buildJoinClause(sSourceType) {
            if (sSourceType === SimilarPartsSourceTypes.CalculationVersions) {
                return 'item.CALCULATION_VERSION_ID = source.CALCULATION_VERSION_ID';
            } else if (sSourceType === SimilarPartsSourceTypes.MasterData) {
                return 'material.MATERIAL_ID = source.MATERIAL_ID';
            }
        }
    }









    function buildScoreComponent(aSearchComponents) {
        _.each(aSearchComponents, function (oComp) {
            let aNumberators = _.map(oComp.Attributes, function (oAttribute) {
                return `POWER(${ oAttribute.Weight } * (1 - ${ oAttribute.Name }_SCORE), 2)`;
            });

            let fDenominator = oComp.Attributes.reduce((sum, oAttr) => {
                return sum + Math.pow(oAttr.Weight, 2);
            }, 0);
            let sScoreStatement = fDenominator === 0 ? 0 : `1 - SQRT(
                (
                    ${ aNumberators.join(' + ') }
                )
                /
                (
                    ${ fDenominator }
                )
            )`;
            oComp.Score = sScoreStatement;
        });
    }








    async function isValidDataSource(oSource) {
        return !helpers.isNullOrUndefined(oSource) && await helpers.isPlainObject(oSource);
    }









    async function isValidChildSource(aChildSource) {
        return !helpers.isNullOrUndefined(aChildSource) && _.isArray(aChildSource) && aChildSource.length > 0;
    }
}

SimilarPartsSearch.prototype = Object.create(SimilarPartsSearch.prototype);
SimilarPartsSearch.prototype.constructor = SimilarPartsSearch;

module.exports = {
    CalculationVersionTables,
    Views,
    MaterialPriceTables,
    MaterialTables,
    MasterDataTables,
    Tables,
    SupportedBusinessObjectTypes,
    SimilarPartsSourceTypes,
    SupportedSqlTypes,
    SupportedScoreFunctions,
    DefaultScoreFunction,
    SimilarPartsSearch
};
export default {_,helpers,MessageLibrary,BusinessObjectTypes,PlcException,Code,DbArtefactController,CalculationVersionTables,Views,MaterialPriceTables,MaterialTables,MasterDataTables,Tables,SupportedBusinessObjectTypes,FuzzyParameters,SimilarPartsSourceTypes,SimilarPartsPriceCommonFields,SimilarPartsCommonFields,SimilarPartsMetadata,SimilarPartsPriceSourceId,MultipleValuesSeparator,SupportedSqlTypes,SupportedScoreFunctions,DefaultScoreFunction,SimilarPartsSearch};
