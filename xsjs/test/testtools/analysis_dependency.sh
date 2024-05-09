#!/bin/sh

# This script is used to analysis circular dependencies among the *.xsjslib files
# Usage:
#       cd hana & src/PLC/testtools/analysis_dependency.sh
#
# the output will contain below data (example) when found circular dependencies
#        ......
#        Found: [ xs.impl.metadata, xs.metadata.metadataProvider ]
#        Found: [ xs.util.constants, xs.util.masterdataResources ]
#        Found: [ xs.util.helpers, xs.util.message ]
#        ......
#
# and the exit code will be the number of found circular dependencies group, so we can
# judge if there have circular dependencies in the code.
#

# get current path
TMP_SRC_PATH=`pwd`

# get shell full path
TMP_BIN_PATH="${TMP_SRC_PATH}/$0"

# get shell dir
TMP_BIN_DIR=`dirname ${TMP_BIN_PATH}`

# get git repo root dir
cd ${TMP_BIN_DIR}
TMP_GIT_ROOT_PATH=`git rev-parse --show-toplevel`
if [ $? -ne 0 ]; then
    echo "-Error: not in git repo"
    exit 1
fi

# cd git repo root dir
cd ${TMP_GIT_ROOT_PATH}

CFG_LIST=_tmp.js
TMP_CIRCULARS=0

func_scan() {
    TMP_CUR=`pwd`
    TMP_DIR=$1
    TMP_FILE=$2

    echo "scan: ${TMP_GIT_ROOT_PATH}/${TMP_DIR}: ${TMP_FILE}"
    cd ${TMP_DIR}
    echo "var aDependencyList = ["         > ${TMP_BIN_DIR}/${CFG_LIST}

    grep '$.import(' * -r --exclude-dir='node_modules' --exclude-dir='.idea' --exclude-dir='.che' --exclude-dir='.git' --include='*.xsjslib' \
        | grep "^${TMP_FILE}/" \
        | grep -v template \
        | grep -v library \
        | grep -v ":[ \t]*\/\/" \
        | grep -v ":[ \t]*\/\*" \
        | grep -v ":[ \t]*\*" \
        | sed 's/\//./g' \
        | sed s#\'#\"#g \
        | sed 's/^\(sap\..*\)\.xsjslib:.*("\(.*\)".*"\(.*\)".*$/["\1", "\2.\3"],/g' \
        | sort -u \
        >> ${TMP_BIN_DIR}/${CFG_LIST}

    echo "[\"END\", \"END\"]"  >> ${TMP_BIN_DIR}/${CFG_LIST}
    echo "];"  >> ${TMP_BIN_DIR}/${CFG_LIST}
    echo ""  >> ${TMP_BIN_DIR}/${CFG_LIST}
    echo "module.exports.aDependencyList = aDependencyList;"  >> ${TMP_BIN_DIR}/${CFG_LIST}
    echo ""  >> ${TMP_BIN_DIR}/${CFG_LIST}

    echo "    ==> Scan complete."
    cd ${TMP_BIN_DIR}

    node ${TMP_BIN_DIR}/analysis_dependency.js
    TMP_CIRCULARS=`expr ${TMP_CIRCULARS} \+ $?`
    echo "    ==> Analysis complete."

    rm ${TMP_BIN_DIR}/${CFG_LIST}
    cd ${TMP_GIT_ROOT_PATH}
}

# for XSA
if [ -d "xsjs/lib" ]; then
    func_scan xsjs/lib sap
fi

if [ -d "xsjs/test" ]; then
    func_scan xsjs/test sap
fi

# for XSC
if [ -d "src/PLC" ]; then
    func_scan src/PLC 
fi

if [ -d "src/PLC/sap/plc_test" ]; then
    func_scan src/PLC sap/plc_test
else
    echo "NOT"
fi

echo "==> Total Found: ${TMP_CIRCULARS}"

exit ${TMP_CIRCULARS}

