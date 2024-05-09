var csvParser = require("../utils/csvParser");
var tableDataSet = require("@sap/xsjs-test/lib/util/tableDataSet");
var TableUtils = require('@sap/xsjs-test/lib/util/tableUtils');

let csvCache = {};

TableUtils.prototype.fillFromCsvFile = function (fullTableName, csvPackage, csvFile, csvProperties) {
    // Here a cache for parsed CSV is maintained
    // CSV properties are ignored in the key because we are sure they are actually constant
    const cacheKey = csvPackage + "::" + csvFile;
    var insertRecordString, params;

    if (cacheKey in csvCache) {
        var cacheValue = csvCache[cacheKey];
        insertRecordString = cacheValue[0];
        params = cacheValue[1];
    } else {
        const defaultProperties = {
            separator: ";",
            headers: true,
            decSeparator: ".",
            castToScalar: false,
            nullValue: "<Null>",
            delimiter: ",",
            skip_empty_lines: false
        };
        var mergedCsvProperties = defaultProperties;
        if (csvProperties) {
            mergedCsvProperties = {
                //csv parse only support delimiter
                delimiter: csvProperties.separator || defaultProperties.separator,
                separator: csvProperties.separator || defaultProperties.separator,
                headers: typeof csvProperties.headers !== "undefined" ? csvProperties.headers : defaultProperties.headers,
                decSeparator: csvProperties.decSeparator || defaultProperties.decSeparator,
                castToScalar: defaultProperties.castToScalar,
                nullValue: typeof csvProperties.nullValue !== "undefined" ? csvProperties.nullValue : defaultProperties.nullValue,
                skip_empty_lines: csvProperties.skip_empty_lines || defaultProperties.skip_empty_lines,
            };
        };

        var parsedObjects = csvParser.parseCsv(csvPackage, csvFile, mergedCsvProperties);
        if (!parsedObjects || parsedObjects.length === 0) {
            throw new Error("CSV file " + csvPackage + "::" + csvFile + " contains no data");
        }
        var tableDataSetToBeInserted = tableDataSet.createFromCSVList(parsedObjects, mergedCsvProperties.headers);
        var insertData = convertToTableInsertData(fullTableName, tableDataSetToBeInserted, mergedCsvProperties);
        if (insertData === null) {
            return;
        }
        insertRecordString = insertData[0];
        params = insertData[1];

        if (csvFile === "t_metadata.csv") {
            params.forEach(metadataEntry => {
                if (metadataEntry[13]) {
                    metadataEntry[13] = metadataEntry[13].replace(/\\/g, '');
                }
            });
        }

        csvCache[cacheKey] = insertData;

        // if the cache size exceeds the limit, simply clear the cache
        if (Object.keys(csvCache).length > 200) {
            csvCache = {};
        }
    }

    this.connection.executeUpdate(insertRecordString, params);
};

function convertToTableInsertData(fullTableName, data, options) {
    var withColumnNames = options.headers;
    var decSeparator = options.decSeparator;
    var nullValue = options.nullValue;
    var rowCount = data.getRowCount();
    var columns = data.getColumns();
    if (rowCount === 0) {
        return null;
    }

    var columnNames = "";
    if (withColumnNames) {
        columnNames = '("' + columns.join('","') + '")';
    }
    var values = "(" + columns.map(function () {
        return "?";
    }).join(",") + ")";

    var insertRecordString = "insert into " + fullTableName + columnNames + " values " + values;
    var row, col;
    var value = "";

    var params = [], line;
    for (row = 0; row < rowCount; row++) {
        line = [];
        for (col = 0; col < columns.length; col++) {
            value = columns[col].getRow(row);
            if (isNullValue(value, false, nullValue)) {
                value = null;
            }
            line.push(value);
        }
        params.push(line);
    }

    return [insertRecordString, params];
}

function isNullValue(value, isStringType, nullValue) {
    return typeof value === "undefined" || value === null || value === nullValue || (!isStringType && value === "");
}

module.exports.TableUtils = TableUtils;
