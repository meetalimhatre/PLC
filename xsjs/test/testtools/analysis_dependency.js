#!/usr/bin/env node

/*
 * this file will load the generated dependency file with below content format, and analysis the internal circular dependencies among them.
 *     var aDependencyList = [
 *         ["a1", "b1"],
 *         ["a1", "b2"],
 *         ["a2", "b3"],
 *         ["a2", "b4"],
 *         ["b2", "c1"],
 *         ["b2", "b3"],
 *         ["b3", "a1"]
 *     ];
 *
 * the output on console will contain the found circular groups like below:
 *     ......
 *     Found: [ a1, b2, b3 ]
 *     ......
 */
var aDependencyList = require("./_tmp.js").aDependencyList;

var iMaxDepth = 0;
var iCirculars = 0;
var aCirculars = [];

/*
 * this method will traverse the array and generate the map like below:
 * {
 *     "a1": [
 *         "b1",
 *         "b2"
 *     ],
 *     "a2": [
 *         "b3",
 *         "b4"
 *     ],
 *     "b2": [
 *         "c1",
 *         "b3"
 *     ],
 *     "b3": [
 *         "a1"
 *     ]
 * }
 */
function generate_dict() {
    var aDict = {};
    var sKey = null;
    var aDependencies = [];

    for (let iIdx in aDependencyList) {
        let aItem = aDependencyList[iIdx];
        if (sKey === null) {
            sKey = aItem[0];
        } else if (sKey !== aItem[0]) {
            aDict[sKey] = aDependencies;
            sKey = aItem[0];
            aDependencies = [];
        }
        aDependencies.push(aItem[1]);
    }

    aDict[sKey] = aDependencies;
    console.log("    ==> Generate HashMap complete.");

    return aDict;
}

/* printf found keys which have circular dependencies among them */
function print_circular_dependency(aStack, iDepth) {
    var aArray = new Array(iDepth + 1);

    for (let iIdx = 0; iIdx <= iDepth; iIdx++) {
        aArray[iIdx] = aStack[iIdx];
    }
    /* sort before compare the string to avoid different order of same keys */
    aArray.sort();

    var sCircular = "[ " + aArray[0];
    for (let iIdx = 1; iIdx <= iDepth; iIdx++) {
        sCircular += ", " + aArray[iIdx];
    }
    sCircular += " ]";

    var bFound = false;
    for (let iIdx = 0; iIdx < iCirculars; iIdx++) {
        if (sCircular === aCirculars[iIdx]) {
            /* already printed */
            bFound = true;
            break;
        }
    }

    if (bFound === false) {
        aCirculars[iCirculars] = sCircular;
        iCirculars++;
        console.log("        Found: " + sCircular);
    }
}

/* chech if the new library exist in current statck */
function check_stack(aStack, iDepth, sItem) {
    /* we only match the stack bottom as a full circular */
    if (aStack[0] === sItem) {
        return 1;
    }

    if (iDepth <= 1) {
        return -1;
    }

    /* for case: a -> b -> c -> d -> e -> c ... , this is the same as : (c -> d -> e) */
    for (let iIdx = 1; iIdx < iDepth; iIdx++) {
        if (sItem === aStack[iIdx]) {
            return 0;
        }
    }

    /* not matched */
    return -1;
}

/* check dependency recursively */
function check_dependency(aDict, aStack, sItemCurrent, iDepth) {
    var aItemList = aDict[sItemCurrent];

    if (aItemList === undefined || aItemList === null || aItemList.length === 0) {
        return;
    }

    if (iDepth > iMaxDepth) {
        iMaxDepth = iDepth;
    }

    aStack[iDepth] = sItemCurrent;
    for (let iIdx in aItemList) {
        let sItem = aItemList[iIdx];
        let iFound = check_stack(aStack, iDepth, sItem);
        if (iFound === 1) {
            print_circular_dependency(aStack, iDepth);
        } else if (iFound === -1) {
            check_dependency(aDict, aStack, aItemList[iIdx], iDepth + 1);
        }
        /* iFound === 0 should be ignored here, reason is in check_stack() */
    }
}


var aCurDict = generate_dict();
var aCurKeys = Object.keys(aCurDict);
var aCurStack = new Array(aCurKeys.length + 2);

console.log("    ==> Total: " + aCurKeys.length + " files");
console.log("    ==> Analysis dependency start...");
for (let iIdx in aCurKeys) {
    if (aCurKeys[iIdx] === "END") {
        break;
    }
    aCurStack[0] = aCurKeys[iIdx];
    check_dependency(aCurDict, aCurStack, aCurKeys[iIdx], 0);
}
console.log("    ==> Max dependency depth: " + iMaxDepth);
console.log("    ==> Analysis dependency complete.");

/* exit code will be the found groups */
process.exit(iCirculars);
