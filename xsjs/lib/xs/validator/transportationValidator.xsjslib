const _ = $.require('lodash');
const PersistencyTransportation = $.import('xs.db', 'persistency-transportation');
const aAllValidTables = PersistencyTransportation.aAllTables;
const aValidBusinessObjects = PersistencyTransportation.mMasterDataBusinessObjects;

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

/**
 * This class constructs BusinessObjectValidator instances for the Transportation business object type. It validates the
 * data in the body of a request. For this, the validation distinguishes the 2 different CRUD operations (GET and POST) 
 * which can be done upon the business object (example: for a GET request no body is allowed, but for POST the body is
 * mandatory).
 *
 * @constructor
 */

function TransportationValidator(oPersistency, sSessionId, utils) {

    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param oPersistency -
	 *            An instance of Persistency to enable access to the data base and retrieve trustworthy data in order to
	 *            validate reference IDs given in the request
	 * @param sSessionId -
	 *            The session id of the request which is necessary for database queries.
	 * @returns
	 *
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        switch (oRequest.method) {
        case $.net.http.GET:
            return await validateExportRequest();
        case $.net.http.POST:
            return await validateImportRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function validateExportRequest() {
            var aTableNames = [];
            var aBusinessObjects = [];

            // check request has empty body
            utils.checkEmptyBody(oRequest.body);

            if (mValidatedParameters.tableNames && mValidatedParameters.businessObjects) {
                const sLogMessage = `Cannot export both tableNames and businessObjects in the same time.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
            }

            if (mValidatedParameters.tableNames) {
                aTableNames.push.apply(aTableNames, mValidatedParameters.tableNames.split(','));
                //check if table(s) can be exported
                var aInvalidExportTables = _.difference(aTableNames, aAllValidTables);
                if (aInvalidExportTables.length !== 0) {
                    var sLogMessage = `Cannot export table(s): ${ aInvalidExportTables }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
            }

            if (mValidatedParameters.businessObjects) {
                aBusinessObjects.push.apply(aBusinessObjects, mValidatedParameters.businessObjects.split(','));
                //check if businessObject can be exported
                var aInvalidExportBusinessObjects = _.difference(aBusinessObjects, _.keys(aValidBusinessObjects));
                if (aInvalidExportBusinessObjects.length !== 0) {
                    const sLogMessage = `Invalid business object(s): ${ aInvalidExportBusinessObjects }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
            }
            return mValidatedParameters;
        }

        async function validateImportRequest() {

            var aBodyItems = utils.tryParseJson(oRequest.body.asString());
            _.each(aBodyItems, async function (oBody, tableName) {
                //check if table content is an array of arrays 
                if (!_.isArray(oBody) || oBody.length === 0 || !_.isArray(oBody[0])) {
                    const sLogMessage = `Invalid content for TableName ${ tableName }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                //check if valid table name
                if (!_.includes(aAllValidTables, tableName)) {
                    const sLogMessage = `TableName ${ tableName } is not valid.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }

                //check column_names are all valid column names for table
                var aTableColumns = await oPersistency.Transportation.getTableColumns(tableName);
                var aDifferentColumns = _.difference(oBody[0], aTableColumns);
                if (aDifferentColumns.length !== 0 || oBody[0].length !== aTableColumns.length) {
                    const sLogMessage = `Invalid colums(s):${ aDifferentColumns } for table ${ tableName }.`;
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                //check if all data rows have the same number of columns as the header
                for (let i = 1; i < oBody.length; i++) {
                    if (oBody[i].length !== aTableColumns.length) {
                        var sRowValues = JSON.stringify(oBody[i]);
                        const sLogMessage = `Invalid number of column values for table ${ tableName } at row index ${ i } (content: ${ sRowValues }).`;
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                }
            });
            return aBodyItems;
        }
    };
}
TransportationValidator.prototype =  Object.create(TransportationValidator.prototype);
TransportationValidator.prototype.constructor = TransportationValidator;
export default {_,PersistencyTransportation,aAllValidTables,aValidBusinessObjects,MessageLibrary,PlcException,Code,TransportationValidator};
