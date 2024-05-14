const xsenv = require('@sap/xsenv');
const isCloud = require('../../../platform/platformSpecificImports.js').isCloud;

function ConnectionFactory($) {
    this.bCommitMode = true;

    /**
     * Create a new connection (and associated transaction).
     * connection.commit() is only executed if bCommitMode is true.
     *
     * @returns $.hdb.Connection
     */
    this.getConnection = async function () {
        // create a real DB connection
        var connection = await $.hdb.getConnection({
            'treatDateAsUTC': true,
            'enableColumnIndices': false
        });

        // replace the real commit function by our own function, which will only
        // be executed if bCommitMode === true
        connection.realCommit = connection.commit;
        connection.commit = () => {
            if (this.bCommitMode) {
                connection.realCommit();
            }
        };
        return connection;
    };
}
module.exports.ConnectionFactory = ConnectionFactory;


let oPlatform = ''; // can be either "CF" for Cloud Foundry, or "XSA-OP" for XSA onPremise
let oRuntimeCredentialsXsaOp = null;

let checkGetRuntimeCredentials = async function () {
    if (oPlatform === '') {
        oPlatform = isCloud() ? 'CF' : 'XSA-OP';
    }

    if (oPlatform === 'XSA-OP' && oRuntimeCredentialsXsaOp === null) {
        try {
            oRuntimeCredentialsXsaOp = xsenv.getServices({ hana: { tag: 'hana' } });
        } catch (err) {
            console.log('[WARN]', err.message);
            oRuntimeCredentialsXsaOp = null;
            let msg = 'ensureXsaRuntimeCredentials() error: ' + err.message;
            throw new PlcException(messageCode.GENERAL_UNEXPECTED_EXCEPTION, msg);
        }
    }
};

/**
 * Get the HDI container's schema. NOTE: for most of the csaes, the caller should avoid calling this function
 * unless really necessary.
 *
 * @param $ xsjs session context
 * @returns HDI container's schema
 */
module.exports.getContainerSchema = async function ($) {
    checkGetRuntimeCredentials();

    let schema = null;
    if (oPlatform === 'XSA-OP') {
        schema = oRuntimeCredentialsXsaOp.hana.schema;
    } else if (oPlatform === 'CF') {
        // in the case of Cloud Foundry multiple HDI containers, this lib do not cache the result.
        let connection = await $.hdb.getConnection({
            'treatDateAsUTC': true,
            'enableColumnIndices': false
        });
        schema = connection.executeQuery('SELECT CURRENT_SCHEMA FROM DUMMY')[0].CURRENT_SCHEMA;
    }

    return schema;
};
export default {xsenv,isCloud,ConnectionFactory,oPlatform,oRuntimeCredentialsXsaOp,checkGetRuntimeCredentials};
