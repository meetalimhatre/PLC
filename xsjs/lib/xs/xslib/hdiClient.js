/*eslint no-console: 0, no-unused-vars: 0*/
const _ = require('lodash');
const {Container, FileWithContent, FolderWithContent, Parameter, File} = require('@sap/hdi');
const Path = require('@sap/hdi/lib/parameter/Path');
const Buffer = require('buffer').Buffer;
const helpers = require('../util/helpers');

/**
 * HDI Client 
 * @constructor
 * @param $ xsjs session context
 * @param sContainer {string} hdi container
 * @param oCredentials {object} database credentials
 */
async function HDIClient($, sContainer, oCredentials) {
    let oConnection = null;

    this.getConnection = () => {
        return oConnection;
    };

    /**
     * log error
     * @param msg {object} error message
     */
    async function loggerError(msg) {
        if (_.isArray(msg)) {
            for (let msgItem of msg) {
              await loggerError(msgItem);
            }
        } else if (_.isObject(msg)) {
            if (!helpers.isNullOrUndefined(msg.SEVERITY) && msg.SEVERITY !== 'INFO') {
                if (!helpers.isNullOrUndefined(msg.PATH) && msg.PATH !== '') {
                     $.trace.error(msg.SEVERITY + ': ' + msg.PATH);
                     $.trace.error(msg.SEVERITY + ': ' + msg.MESSAGE + '\n');
                } else {
                     $.trace.error(msg.SEVERITY + ': ' + msg.MESSAGE);
                }
            }
        }
    }

    /**
     * create HDI connection
     */
    this.openConnection = () => {
        if (oConnection !== null) {
            return;
        }

        if (helpers.isNullOrUndefined(sContainer) || helpers.isNullOrUndefined(oCredentials)) {
            let sError = `invalid schema or credentials`;
             $.trace.error(sError);
            throw sError;
        }

        oConnection = new Container(sContainer, oCredentials, oCredentials.user);
        oConnection.sync.connect();
    };

    /**
     * close connection
     */
    this.closeConnection = () => {
        if (oConnection !== null) {
            oConnection.disconnect();
            oConnection = null;
        }
    };

    /**
     * get changed files list under some paths 
     * @param aPath {array} An array of path names
     */
    this.listChanged = aPath => {
        if (helpers.isNullOrUndefined(aPath)) {
            throw 'listChanged(): Invalid aPath: ' + aPath;
        }

        if (aPath.length === 0) {
            $.trace.warn('Warn: listChanged(): empty aPath');
            return;
        }

        try {
            let oResult = oConnection.sync.status(aPath.map(path => {
                return new Path(path);
            }), []);
            if (oResult.rc !== 0) {
                throw 'listChanged() failed with RETURN_CODE: ' + oResult.rc;
            }
            return oResult.results;
        } catch (err) {
            throw err;
        }
    };

    /**
     * get deployed files list under some paths
     * @param aPath {array} An array of path names
     * @param bRecursive {boolean} 
     */
    this.listDeployed = (aPath, bRecursive) => {
        if (helpers.isNullOrUndefined(aPath)) {
            throw 'listDeployed(): Invalid aPath: ' + aPath;
        }

        if (aPath.length === 0) {
            $.trace.warn('Warn: listDeployed(): empty aPath');
            return;
        }

        let aParams = bRecursive ? [new Parameter('RECURSIVE', 'TRUE')] : [];
        try {
            let oResult = oConnection.sync.listDeployed(aPath.map(path => {
                return new Path(path);
            }), aParams);
            if (oResult.rc !== 0) {
                throw 'listDeployed() failed with RETURN_CODE: ' + oResult.rc;
            }
            return oResult.results;
        } catch (err) {
            throw err;
        }
    };

    function addPathContent(oPathSets, aPendingPathContentList, oPathContent) {
        if (oPathContent.PATH.charAt(oPathContent.PATH.length - 1) === '/') {
            return;
        }

        let aSubList = oPathContent.PATH.split('/');
        let dDepth = aSubList.length - 1;
        let sFullname = '';
        for (let dIdx = 0; dIdx < dDepth; dIdx++) {
            sFullname += aSubList[dIdx] + '/';
            if (!oPathSets.has(sFullname)) {
                let oDirContent = Buffer.alloc(0);
                aPendingPathContentList.push(new FolderWithContent(sFullname));
                oPathSets.add(sFullname);
            }
        }
        if (oPathContent.PATH.charAt(oPathContent.PATH.length - 1) !== '/') {
            let oContent = Buffer.from(oPathContent.CONTENT);
            aPendingPathContentList.push(new FileWithContent(oPathContent.PATH, oContent));
        }
    }

    /**
     * upsert list to work filesystem
     * @param aPathContent {array} An array of {path, content}
     */
    this.upsert = async aPathContent => {
        if (helpers.isNullOrUndefined(aPathContent)) {
            throw 'upsert(): Invalid aPathContent: ' + aPathContent;
        }

        if (aPathContent.length === 0) {
            $.trace.warn('Warn: upsert(): empty aPathContent');
            return;
        }

        let aPendingPathContent = [];
        let oPathSets = new Set();

        for (let oPathContent of aPathContent) {
            await addPathContent(oPathSets, aPendingPathContent, oPathContent);
        }

        try {
            let oResult = oConnection.sync.write(aPendingPathContent, []);
            if (oResult.rc !== 0) {
                throw 'upsert() failed with RETURN_CODE: ' + oResult.rc;
            }
        } catch (err) {
             $.trace.error('Error: upsert(): ' + err);
             console.log(err);
            throw err;
        }
    };

    /**
     * delte files list from work filesystem
     * @param aPath {array} An array of path names
     * @param bRecursive {boolean} 
     */
    this.delete = async (aPath, bRecursive) => {
        if (helpers.isNullOrUndefined(aPath)) {
            throw 'delete(): Invalid aPath: ' + aPath;
        }

        if (aPath.length === 0) {
            $.trace.warn('Warn: delete(): empty aPath');
            return;
        }

        let aParams = [new Parameter('IGNORE_NON_EXISTING_PATHS', 'TRUE')];
        if (bRecursive) {
            aParams.push(new Parameter('RECURSIVE', 'TRUE'));
        }

        try {
            let oResult = oConnection.sync.delete(aPath.map(path => {
                return new Path(path);
            }), aParams);
            if (oResult.rc !== 0) {
                throw 'delete() failed with RETURN_CODE: ' + oResult.rc;
            }
        } catch (err) {
            $.trace.error('Error: delete(): ' + err);
            throw err;
        }
    };

    /**
     * read deployed files list from deployed filesystem
     * @param aPath {array} An array of path names
     * @param bRecursive {boolean} 
     */
    this.readDeployed = async (aPath, bRecursive) => {
        if (helpers.isNullOrUndefined(aPath)) {
            throw 'readDeployed(): Invalid aPath: ' + aPath;
        }

        if (aPath.length === 0) {
            $.trace.warn('Warn: readDeployed(): empty aPath');
            return [];
        }

        let aParams = bRecursive ? [new Parameter('RECURSIVE', 'TRUE')] : [];
        try {
            let oResult = oConnection.sync.readDeployed(aPath.map(path => {
                return new Path(path);
            }), aParams);
            if (oResult.rc !== 0) {
                throw 'readDeployed() failed with RETURN_CODE: ' + oResult.rc;
            }
            return oResult.results;
        } catch (err) {
            $.trace.error('Error: readDeployed(): ' + err);
            throw err;
        }
    };

    /**
     * deploy all change files under sRoot
     * @param sRoot {string} path
     */
    this.make = async sRoot => {
        if (helpers.isNullOrUndefined(sRoot)) {
            throw 'make(): Invalid sRoot: ' + sRoot;
        }

        let aDeployPath = [];
        let aUndeployPath = [];

        try {
            /* get listChanged list */
            let aItemList = this.listChanged([sRoot]);

            /* handle the listChanged result to shared variable 
            *  for following oItem.status
            *  D: deleted files  A: new added files   M: modified file*/
            for (let oItem of aItemList) {
                if (oItem.status === 'D') {
                    aUndeployPath.push(new File(oItem.path));
                } else if (oItem.status === 'A' || oItem.status === 'M') {
                    aDeployPath.push(new File(oItem.path));
                }
            }

            if (aDeployPath.length > 0 || aUndeployPath.length > 0) {
                let oResult = oConnection.sync.make(aDeployPath, aUndeployPath, [], []);
                // only throw if the return code is not  0 (success) or 1 (warnings)
                if (oResult.rc !== 0 && oResult.rc !== 1) {
                    let sError = 'make() failed with RETURN_CODE: ' + oResult.rc;
                    if (_.isArray(oResult.messages)) {
                        sError += '. Details:';
                        _.each(oResult.messages, m => {
                            sError += `\n    ${ m.ROW_ID }: [${ m.SEVERITY }] ${ m.MESSAGE }`;
                        });
                    }
                    ;
                    throw sError;
                }
            }
        } catch (err) {
            $.trace.error('Error: make(): ' + err);
            throw err;
        }
    };

    /**
     * restore all changed files in container working file system if make failed
     * @param sRoot {string} path
     */
    this.restore = async sRoot => {
        if (helpers.isNullOrUndefined(sRoot)) {
            throw 'restore(): Invalid sRoot: ' + sRoot;
        }

        let aModList = [];
        let aDelList = [];

        try {
            let aItemList = this.listChanged([sRoot]);
            for (let oItem of aItemList) {
                if (oItem.status === 'A') {
                    /* the newly added files need delete */
                    aDelList.push(oItem.path);
                } else if (oItem.status === 'M' || oItem.status === 'D') {
                    /* the deleted or modified files need write back with previous content */
                    aModList.push(oItem.path);
                }
            }

            /* reset changed files */
            if (aModList.length > 0) {
                let oPendingPathContent = [];
                let aObjList = this.readDeployed(aModList, false);
                for (let oItem of aObjList) {
                    oPendingPathContent.push({
                        PATH: oItem.path,
                        CONTENT: oItem.content
                    });
                }
                this.upsert(oPendingPathContent);
            }

            /* delete newly added files */
            if (aDelList.length > 0) {
                this.delete(aDelList);
            }
        } catch (err) {
            $.trace.error('Error: restore(): ' + err);
            throw err;
        }
    };
}

HDIClient.prototype = Object.create(HDIClient.prototype);
HDIClient.prototype.constructor = HDIClient;

module.exports.HDIClient = HDIClient;
export default {HDIClient,loggerError,addPathContent};
