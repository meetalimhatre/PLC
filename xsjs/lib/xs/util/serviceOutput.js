const _ = require('lodash');
const helpers = require('./helpers');
const MessageLibrary = require('./message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

async function logError(msg) {
    await helpers.logError(msg);
}

/**
Class to create objects that contain the structure of a service response. The following structure is produced:
payload : {
    head : {
        messages : [],
        metadata : {}
    }

    body : {
        transactional : [],
        masterdata : {},
        calculated : []
    }
}
*/
async function ServiceOutput() {

    var payload = {
        body: {},
        head: {}
    };
    var status;

    var oAllowedStatusCodes = await Object.freeze({
        'CONTINUE': 100,
        'SWITCH_PROTOCOL': 101,
        'OK': 200,
        'CREATED': 201,
        'ACCEPTED': 202,
        'NON_AUTHORITATIVE': 203,
        'RESET_CONTENT': 205,
        'PARTIAL_CONTENT': 206,
        'MULTIPLE_CHOICES': 300,
        'MOVED_PERMANENTLY': 301,
        'FOUND': 302,
        'SEE_OTHER': 303,
        'NOT_MODIFIED': 304,
        'USE_PROXY': 305,
        'TEMPORARY_REDIRECT': 307,
        'BAD_REQUEST': 400,
        'UNAUTHORIZED': 401,
        'PAYMENT_REQUIRED': 402,
        'FORBIDDEN': 403,
        'NOT_FOUND': 404,
        'METHOD_NOT_ALLOWED': 405,
        'NOT_ACCEPTABLE': 406,
        'PROXY_AUTH_REQUIRED': 407,
        'REQUEST_TIMEOUT': 408,
        'CONFLICT': 409,
        'GONE': 410,
        'LENGTH_REQUIRED': 411,
        'PRECONDITION_FAILED': 412,
        'REQUEST_ENTITY_TOO_LARGE': 413,
        'REQUEST_URI_TOO_LONG': 414,
        'UNSUPPORTED_MEDIA_TYPE': 415,
        'REQUESTED_RANGE_NOT_SATISFIABLE': 416,
        'EXPECTATION_FAILED': 417,
        'UNPROCESSABLE_ENTITY': 422,
        'INTERNAL_SERVER_ERROR': 500,
        'NOT_YET_IMPLEMENTED': 501,
        'BAD_GATEWAY': 502,
        'SERVICE_UNAVAILABLE': 503,
        'GATEWAY_TIMEOUT': 504,
        'HTTP_VERSION_NOT_SUPPORTED': 505
    });

    Object.defineProperties(this, {
        'payload': {
            get: function () {
                return payload;
            }
        },
        'status': {
            get: function () {
                return status;
            }
        }
    });


    /**
    *	Payload can be set directly to override complete response structure
    */
    this.setPayload = async function (oPayload) {
        if (payload !== undefined) {
            const sLogMessage = 'In order to prevent information loss, you cannot set payload directly if the object is already defined.';
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }

        payload = oPayload;
        return this;
    };


    /**
	 * Body can be set directly to override separation in transactional,
	 * masterdata, calculated (if not applicable)
	 */
    this.setBody = function (oBody) {
        payload = payload || {};

        /*
		if (payload.body !== undefined) {
			const sLogMessage = "In order to prevent information loss, you should not set body directly if the object is already defined";
			logError(sLogMessage);
			throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
		}
	*/
        if (oBody !== undefined) {
            payload.body = oBody;
        }

        return this;
    };

    this.setTransactionalData = function (oTransactional) {
        payload = payload || {};
        payload.body = payload.body || {};

        // It is expected that transactional data are always an array
        if (oTransactional !== null && oTransactional !== undefined) {
            if (_.isArray(oTransactional)) {
                payload.body.transactionaldata = oTransactional;
            } else {
                payload.body.transactionaldata = [oTransactional];
            }
        }
        return this;
    };

    this.addTransactionalData = function (oTransactional) {
        payload = payload || {};
        payload.body = payload.body || {};
        payload.body.transactionaldata = payload.body.transactionaldata || [];

        payload.body.transactionaldata.push(oTransactional);
        return this;
    };

    this.setReferencesData = function (oReference) {
        payload = payload || {};
        payload.body = payload.body || {};
        if (oReference !== null && oReference !== undefined) {
            if (_.isArray(oReference)) {
                payload.body.referencesdata = oReference;
            } else {
                payload.body.referencesdata = oReference;
            }
        }
        return this;
    };

    this.setCalculationResult = function (oCalculationResult) {
        payload = payload || {};
        payload.body = payload.body || {};

        payload.body.calculated = oCalculationResult;
        return this;
    };

    this.setLayoutData = function (aLayout) {
        payload = payload || {};
        payload.body = payload.body || {};
        if (aLayout !== null && aLayout !== undefined) {
            payload.body.LAYOUTS = aLayout;
        }
        return this;
    };

    this.addMessage = function (oMessage) {
        payload = payload || {};
        payload.head = payload.head || {};
        payload.head.messages = payload.head.messages || [];

        payload.head.messages.push(oMessage);
        return this;
    };

    this.clearMessages = function () {
        if (payload !== undefined && payload.head !== undefined && payload.head.messages !== undefined) {
            payload.head.messages = [];
        }
        return this;
    };

    this.addMasterdata = function (oMasterdata) {
        payload = payload || {};
        payload.body = payload.body || {};
        payload.body.masterdata = payload.body.masterdata || {};

        _.extend(payload.body.masterdata, oMasterdata);

        return this;
    };

    this.setMasterdata = function (oMasterdata) {
        payload = payload || {};
        payload.body = payload.body || {};

        // It is expected that transactional data are always an array
        if (oMasterdata !== null && oMasterdata !== undefined) {
            payload.body.masterdata = oMasterdata;
        }
        return this;
    };

    /**
     * Adds metadata to service output.
     * Value can be passed as object or literal. In case of literal the value(literal) is set to metadata key.
     * In case of object, the value(object) belongs to a specific metadata key.
     * The metadata key contains an array of values and the value(object) parameter is added to the corresponding array.
     * In this case addMetadata function will be called for each object that must be added to metadata key.
     * eg: metadata skey:"calculationVersion"; metadata value: [{"CALCULATION_VERSION_ID": 2809,"IS_DIRTY": 0,"IS_LOCKED": 0}]
     */
    this.addMetadata = async function (sKey, value) {
        payload = payload || {};
        payload.head = payload.head || {};
        payload.head.metadata = payload.head.metadata || {};

        var metadata = payload.head.metadata;
        if (await helpers.isPlainObject(value)) {
            if (_.has(metadata, sKey)) {
                metadata[sKey].push(value);
            } else {
                metadata[sKey] = [];
                metadata[sKey].push(value);
            }
        } else {
            metadata[sKey] = value;
        }
        return this;
    };

    this.setStatus = async function (iValue) {
        if (!_.includes(_.values(oAllowedStatusCodes), iValue)) {
            const sLogMessage = `${ iValue } is not a valid http status code.`;
            await logError(sLogMessage);
            throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
        }
        status = iValue;
        return this;
    };

    var oFollowUp;
    this.setFollowUp = function (oFUp) {
        oFollowUp = oFUp;
    };

    this.getFollowUp = function () {
        return oFollowUp;
    };
}

module.exports = ServiceOutput;
export default {_,helpers,MessageLibrary,PlcException,Code,logError,ServiceOutput};
