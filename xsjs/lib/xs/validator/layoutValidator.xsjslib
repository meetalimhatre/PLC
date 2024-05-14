const _ = $.require('lodash');
const helpers = $.require('../util/helpers');
const Constants = $.require('../util/constants');
const MessageLibrary = $.require('../util/message');
const constants = $.require('../util/constants');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

var Tables = Object.freeze({ costing_sheet_row: 'sap.plc.db::basis.t_costing_sheet_row' });

/**
 * This class constructs BusinessObjectValidator instances for the  business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 *
 * @constructor
 */

function LayoutValidator(oPersistency, utils) {

    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{oLayout} 
	 *				Validated  object
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        switch (oRequest.method) {
        case $.net.http.GET:
            return utils.checkEmptyBody(oRequest.body);
        case $.net.http.POST:
            return await validatePostRequest();
        case $.net.http.PUT:
            return await validatePutRequest();
        case $.net.http.DEL:
            return await validateDeleteRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }.`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }

        async function validatePostRequest() {
            var oLayout = utils.tryParseJson(oRequest.body.asString());

            var aCreateMandatoryProperties = ['LAYOUT_ID'];
            if (mValidatedParameters.is_corporate === false) {
                aCreateMandatoryProperties.push('IS_CURRENT');
            }
            var aCreateValidProperties = [
                'LAYOUT_ID',
                'IS_CURRENT',
                'LAYOUT_NAME',
                'LAYOUT_COLUMNS',
                'HIDDEN_FIELDS',
                'LAYOUT_TYPE'
            ];

            //for the current layout the name should always be empty
            if (oLayout.IS_CURRENT === 0) {
                aCreateMandatoryProperties = _.difference(aCreateMandatoryProperties, ['LAYOUT_NAME']);
            }

            //check mandatory properties and invalid properties for layout
            await utils.checkMandatoryProperties(oLayout, aCreateMandatoryProperties);
            utils.checkInvalidProperties(oLayout, aCreateValidProperties);

            //check mandatory and invalid properties for layout_columns and hidden_fields
            await checkLayoutColumns(oLayout);
            await checkHiddenFields(oLayout);

            return oLayout;
        }

        async function checkLayoutColumns(oLayout) {
            var aDisplayOrder = [];
            var aColumnsMetadataFields = [];

            if (!helpers.isNullOrUndefined(oLayout.LAYOUT_COLUMNS)) {
                if (!_.isArray(oLayout.LAYOUT_COLUMNS)) {
                    const sLogMessage = 'Layout columns are not an array.';
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                if (oLayout.LAYOUT_COLUMNS.length > 0) {
                    _.each(oLayout.LAYOUT_COLUMNS, async function (oLayoutColumn) {
                        aDisplayOrder.push(oLayoutColumn.DISPLAY_ORDER);
                        if (!helpers.isNullOrUndefined(oLayoutColumn.COLUMN_ID)) {
                            // Column from side-panel, except costing sheet or component split
                            await utils.checkMandatoryProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'PATH',
                                'BUSINESS_OBJECT',
                                'COLUMN_ID'
                            ]);
                            var validProps = [
                                'DISPLAY_ORDER',
                                'COLUMN_WIDTH',
                                'PATH',
                                'BUSINESS_OBJECT',
                                'COLUMN_ID'
                            ];

                            // Columns to show costing sheet or component split rows values for totalCost, totalCost2 and totalCost3
                            // are allowed to have "PATH", "BUSINESS_OBJECT" and "COLUMN_ID"
                            if (constants.CalculationVersionCostingSheetTotals.includes(oLayoutColumn.COLUMN_ID)) {
                                validProps.push('COSTING_SHEET_ROW_ID', 'COST_COMPONENT_ID');
                            }
                            utils.checkInvalidProperties(oLayoutColumn, validProps);
                            //add object only if it is not already the array, same path, business_object, column_id can appear multiple times in the layout_columns
                            if (helpers.isNullOrUndefined(_.find(aColumnsMetadataFields, _.omit(oLayoutColumn, 'DISPLAY_ORDER')))) {
                                aColumnsMetadataFields.push(oLayoutColumn);
                            }
                        } else if (!helpers.isNullOrUndefined(oLayoutColumn.COSTING_SHEET_ROW_ID)) {
                            // costing sheet column
                            await utils.checkMandatoryProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'COSTING_SHEET_ROW_ID'
                            ]);
                            utils.checkInvalidProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'COLUMN_WIDTH',
                                'COSTING_SHEET_ROW_ID'
                            ]);
                        } else if (!helpers.isNullOrUndefined(oLayoutColumn.COST_COMPONENT_ID)) {
                            // component split column
                            await utils.checkMandatoryProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'COST_COMPONENT_ID'
                            ]);
                            utils.checkInvalidProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'COLUMN_WIDTH',
                                'COST_COMPONENT_ID'
                            ]);
                        } else if (helpers.isNullOrUndefined(oLayoutColumn.COLUMN_ID)) {

                            await utils.checkMandatoryProperties(oLayoutColumn, ['DISPLAY_ORDER']);
                            utils.checkInvalidProperties(oLayoutColumn, [
                                'DISPLAY_ORDER',
                                'COLUMN_WIDTH'
                            ]);
                        }
                    });

                    var oCurrentMetadata = oPersistency.Metadata.getMetadata(aColumnsMetadataFields);

                    _.each(aColumnsMetadataFields, oField => {
                        var bFieldExists = _.some(oCurrentMetadata, oDbMetadata => {
                            return oField.PATH.toUpperCase() === oDbMetadata.PATH.toUpperCase() && oField.BUSINESS_OBJECT.toUpperCase() === oDbMetadata.BUSINESS_OBJECT.toUpperCase() && oField.COLUMN_ID.toUpperCase() === oDbMetadata.COLUMN_ID.toUpperCase();
                        });
                        if (!bFieldExists) {
                            const sLogMessage = 'The columns defined in the layout cannot be found in the metadata.';
                            $.trace.error(sLogMessage);
                            throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                        }
                    });
                }
            }
        }

        async function checkHiddenFields(oLayout) {
            if (!helpers.isNullOrUndefined(oLayout.HIDDEN_FIELDS)) {
                if (!_.isArray(oLayout.HIDDEN_FIELDS)) {
                    const sLogMessage = 'Hidden fields are not an array.';
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }
                if (oLayout.HIDDEN_FIELDS.length > 0) {
                    _.each(oLayout.HIDDEN_FIELDS, async function (oHiddenField) {
                        await utils.checkMandatoryProperties(oHiddenField, [
                            'PATH',
                            'BUSINESS_OBJECT',
                            'COLUMN_ID'
                        ]);
                        utils.checkInvalidProperties(oHiddenField, [
                            'PATH',
                            'BUSINESS_OBJECT',
                            'COLUMN_ID'
                        ]);
                    });
                    var aMetadataFields = oPersistency.Metadata.getMetadata(oLayout.HIDDEN_FIELDS);
                    if (aMetadataFields.length !== oLayout.HIDDEN_FIELDS.length) {
                        const sLogMessage = 'The ids were not found in metadata table.';
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                }
            }
        }

        async function validatePutRequest() {
            var oLayout = utils.tryParseJson(oRequest.body.asString());

            var aUpdateMandatoryProperties = ['LAYOUT_ID'];
            var aUpdateValidProperties = [
                'LAYOUT_ID',
                'IS_CURRENT',
                'LAYOUT_NAME',
                'LAYOUT_COLUMNS',
                'HIDDEN_FIELDS',
                'LAYOUT_TYPE'
            ];


            await utils.checkMandatoryProperties(oLayout, aUpdateMandatoryProperties);
            utils.checkInvalidProperties(oLayout, aUpdateValidProperties);


            await checkLayoutColumns(oLayout);
            await checkHiddenFields(oLayout);

            return oLayout;
        }

        async function validateDeleteRequest() {
            var aDeleteMandatoryProperties = ['LAYOUT_ID'];
            var oLayout = utils.tryParseJson(oRequest.body.asString());

            await utils.checkMandatoryProperties(oLayout, aDeleteMandatoryProperties);
            utils.checkInvalidProperties(oLayout, aDeleteMandatoryProperties);

            return oLayout;
        }
    };
}

LayoutValidator.prototype = Object.create(LayoutValidator.prototype);
LayoutValidator.prototype.constructor = LayoutValidator;
export default {_,helpers,Constants,MessageLibrary,constants,PlcException,Code,Tables,LayoutValidator};
