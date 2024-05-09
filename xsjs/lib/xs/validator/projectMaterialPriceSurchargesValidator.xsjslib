const _ = $.require('lodash');

const MessageLibrary = $.require('../util/message');
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const SurchargePlaceholders = $.require('../util/constants').SurchargePlaceholders;
const helpers = $.require('../util/helpers');

/**
 * This class constructs BusinessObjectValidator instances for the  business object type ProjectMaterialPriceSurcharges.
 * It validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 * 
 * @param oPersistency -
 *				Persistency object
 * @param utils -
 *				BusinessObjectValidatorUtils object for this validator.
 *
 * @constructor
 */

function ProjectMaterialPriceSurchargesValidator(oPersistency, utils) {
    // mandatory and valid properties
    const aSurchargeMandatoryProperties = [
        'PLANT_ID',
        'ACCOUNT_GROUP_ID',
        'MATERIAL_GROUP_ID',
        'MATERIAL_TYPE_ID',
        'PERIOD_VALUES',
        'MATERIAL_ID'
    ];
    const aSurchargeValidProperties = [
        'PLANT_ID',
        'PLANT_DESCRIPTION',
        'ACCOUNT_GROUP_ID',
        'ACCOUNT_GROUP_DESCRIPTION',
        'MATERIAL_GROUP_ID',
        'MATERIAL_GROUP_DESCRIPTION',
        'MATERIAL_TYPE_ID',
        'MATERIAL_TYPE_DESCRIPTION',
        'PERIOD_VALUES',
        'MATERIAL_ID',
        'MATERIAL_DESCRIPTION'
    ];
    // mandatory and valid properties for surcharge values
    const aValueMandatoryProperties = [
        'LIFECYCLE_PERIOD_FROM',
        'VALUE'
    ];
    const aValueValidProperties = [
        'LIFECYCLE_PERIOD_FROM',
        'LIFECYCLE_PERIOD_FROM_DATE',
        'VALUE'
    ];

    /**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *				The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *				Validated request parameters.
	 * @returns {aProjectMaterialPriceSurcharges} 
	 *				Validated surcharge objects
	 * @throws {ValidationException}
	 *				If request method cannot be validated, the request body cannot be parsed as JSON array, 
	 *				mandatory item properties are missing or the request body contains invalid properties.
	 * 				Also when property values cannot be validated against the data types.
	 */
    this.validate = async function (oRequest, mValidatedParameters) {
        async function validateUpdateRequest() {
            var aProjectMaterialPriceSurcharges = utils.parseCheckProjectDetails(oRequest);

            _.each(aProjectMaterialPriceSurcharges, async function (oProjectSurcharges) {
                utils.checkArrayProperties(oProjectSurcharges, aSurchargeMandatoryProperties, aSurchargeValidProperties, {
                    PLANT_ID: [
                        'String',
                        'length=8;',
                        true
                    ],
                    ACCOUNT_GROUP_ID: [
                        'Integer',
                        undefined,
                        true
                    ],
                    MATERIAL_GROUP_ID: [
                        'String',
                        'length=9;',
                        true
                    ],
                    MATERIAL_TYPE_ID: [
                        'String',
                        'length=4;',
                        true
                    ],
                    MATERIAL_ID: [
                        'String',
                        'length=40;',
                        true
                    ]
                });
                if (parseInt(oProjectSurcharges.ACCOUNT_GROUP_ID, 10) < -2) {
                    const sLogMessage = 'Value of ACCOUNT_GROUP_ID should not be less than -2.';
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                }

                if (!_.isArray(oProjectSurcharges.PERIOD_VALUES)) {
                    const sLogMessage = 'Project details do not contain the array PERIOD_VALUES.';
                    $.trace.error(sLogMessage);
                    throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
                }
                _.each(oProjectSurcharges.PERIOD_VALUES, async function (oSurchargeValue) {
                    utils.checkArrayProperties(oSurchargeValue, aValueMandatoryProperties, aValueValidProperties, {
                        LIFECYCLE_PERIOD_FROM: [
                            'Integer',
                            undefined,
                            true
                        ],
                        VALUE: [
                            'Decimal',
                            'precision=28; scale=7;',
                            true
                        ]
                    });

                    if (oSurchargeValue.VALUE === '0') {
                        const sLogMessage = 'Value of surcharge cannot be 0.';
                        $.trace.error(sLogMessage);
                        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
                    }
                });
            });

            let aPropertiesToBeChecked = [
                'PLANT_ID',
                'ACCOUNT_GROUP_ID',
                'MATERIAL_GROUP_ID',
                'MATERIAL_TYPE_ID',
                'MATERIAL_ID'
            ];
            let oProjectMasterdata = await helpers.prepareSurchargesMasterdataValuesForValidation(aPropertiesToBeChecked, aProjectMaterialPriceSurcharges);

            // the checks for existing master data can only be performed if the project exists, since otherwise no controlling area can be determined, which would lead
            // to an exception for non-existing masterdata in any case; this is a conceptional flaw of the validation, since only the business logic later checks for the 
            // existence of the project; general validation refactoring would be necessary; postponed du to unclear future of this code in XSA (RF)
            if (oPersistency.Project.exists(mValidatedParameters.id)) {
                // Check that referenced masterdata does exist; note that the for surcharges placeholders can be used, for this reason those placeholders are added to the set
                // of valid values; for plants also the value for no plants ("") is allowed
                oPersistency.Project.checkMasterdataReferences(oProjectMasterdata, mValidatedParameters, aPropertiesToBeChecked);
            }

            return aProjectMaterialPriceSurcharges;
        }

        switch (oRequest.method) {
        case $.net.http.GET:
            return utils.checkEmptyBody(oRequest.body);
        case $.net.http.PUT:
            return await validateUpdateRequest();
        default: {
                const sLogMessage = `Cannot validate HTTP method ${ oRequest.method } on service resource ${ oRequest.queryPath }`;
                $.trace.error(sLogMessage);
                throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
            }
        }
    };
}

ProjectMaterialPriceSurchargesValidator.prototype = await Object.create(ProjectMaterialPriceSurchargesValidator.prototype);
ProjectMaterialPriceSurchargesValidator.prototype.constructor = ProjectMaterialPriceSurchargesValidator;
export default {_,MessageLibrary,PlcException,Code,SurchargePlaceholders,helpers,ProjectMaterialPriceSurchargesValidator};
