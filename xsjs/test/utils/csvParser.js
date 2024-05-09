var fs = require('fs');
var path = require('path');
var csvParser = require('csv-parse');
var process = require('process');
var parse = require('csv-parse/lib/sync');

// root directories of the CSV files
const aRootDirs = [
    "../db",          // folder under db module
    "lib",            // folder xsjs/lib
    "test"            // folder xsjs/test
];
const defaultDir = "test";

/**
 *
 * @param {string} sCsvPackage - csv file package name
 * @param {string} sCsvFile - csv file name
 * @param {object} oCsvProperties -csv properties
 * @return {array} return parsed csv as array
 */
function parseCsv(sCsvPackage, sCsvFile, oCsvProperties){
	var filePath = getRepositoryPath(sCsvPackage, sCsvFile);
    var fileData = fs.readFileSync(filePath);
	return csvParser.sync(fileData, oCsvProperties);
}

/**
 * Check file exists in "lib" or "test" package, compatible to auit and other tests.
 * @param {string} sCsvPackage - csv package name
 * @param {string} sCsvFile - csv file name
 * @return {boolean} return exists status
 */
function csvExists(sCsvPackage, sCsvFile) {
    return aRootDirs.some((sRootDir) => {
        let sFullPath = getFullPath(sRootDir, sCsvPackage, sCsvFile);
        return fs.existsSync(sFullPath);
    });
}

function getRepositoryPath(sCsvPackage, sCsvFile) {
    var count = 0;
    var repositoryPath = null;
    aRootDirs.forEach(function (dir, i) {
        var fullPath = getFullPath(dir, sCsvPackage, sCsvFile);
        if (fs.existsSync(fullPath)) {
            count++;
            repositoryPath = fullPath;
        }
    });
    if (count === 0) {
        throw new Error("CSV file " + sCsvPackage + "::" + sCsvFile + " not found");
    }
    if (count > 1) {
        console.log("file is exiting in multiple rootdirs, load file from lib rootdir by default");
        repositoryPath = getFullPath(defaultDir, sCsvPackage, sCsvFile);
    }
    return repositoryPath;
}

function getFullPath(dir, sCsvPackage, sCsvFile) {
    var filePath;
    if ((dir === "../db") && (sCsvPackage === "db.content")) {
        // special handling to reuse the CSV files under db module
        filePath = dir + "/src/content/" + sCsvFile;
    } else {
        filePath = dir + "/" + sCsvPackage.replace(/\./gi, '/') + "/" + sCsvFile;
    }
    return path.resolve(process.cwd(), filePath);
}

function csvToObjects(sCsvPackage, sCsvFile, oCsvProperties) {
    var filePath = getRepositoryPath(sCsvPackage, sCsvFile);
    var fileData = fs.readFileSync(filePath);
	return parse(fileData,{
        columns: true,
        delimiter: oCsvProperties['separator']
    });
}

module.exports.parseCsv = parseCsv;
module.exports.csvExists = csvExists;
module.exports.csvToObjects = csvToObjects;