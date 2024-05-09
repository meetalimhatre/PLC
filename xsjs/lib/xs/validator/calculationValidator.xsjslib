const _ = $.require("lodash");
const helpers = $.require("../util/helpers");

const BusinessObjectTypes = $.require("../util/constants").BusinessObjectTypes;

var GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;
const CalculationVersionValidator = $.import("xs.validator", "calculationVersionValidator").CalculationVersionValidator;
const ItemValidator = $.require("./itemValidator").ItemValidator;

const MessageLibrary = $.require("../util/message");
const MessageDetails = MessageLibrary.Details;
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;

/**
 * This class constructs BusinessObjectValidator instances for the Calculation business object type. It validates the
 * data in the body of a request. For this, the validation distinguishes the different CRUD operations which can be done
 * upon the business object (example: for a GET request no body is allowed, but for POST and DELETE the body is
 * mandatory).
 * 
 * @constructor
 */

function CalculationValidator(oPersistency, sSessionId, metadataProvider, utils) {

	var genericSyntaxValidator = new GenericSyntaxValidator();
	const itemValidator = new ItemValidator($, oPersistency, sSessionId, $.getPlcUsername(), metadataProvider, utils);
	const cvValidator = new CalculationVersionValidator(oPersistency, sSessionId, metadataProvider, utils);
	
	var aDeleteMandatoryPropertiesStatic = [ "CALCULATION_ID" ];
	var aCopyVersionMandatoryPropertiesStatic = [ "PROJECT_ID" ]; 

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
	this.validate = function(oRequest, mValidatedParameters) {
		// self needed, because this context needed from outside of the nested functions
		const self = this;
		
		switch (oRequest.method) {
			case $.net.http.GET:
				return utils.checkEmptyBody(oRequest.body);
			case $.net.http.PUT:
				return validateUpdateRequest();
			case $.net.http.POST:
				if(mValidatedParameters.action == "create")
					return validateCreateRequest();
				else if(mValidatedParameters.action == "copy-version")
					return validateCopyVersionRequest();
				else
					break;
			case $.net.http.DEL:
				return validateDeleteRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}

		function validateDeleteRequest() {
			var aCalcs = utils.tryParseJson(oRequest.body.asString());
			var aValidatedCalcs = [];
			_.each(aCalcs, function(oCalc) {
				utils.checkMandatoryProperties(oCalc, aDeleteMandatoryPropertiesStatic);
				utils.checkInvalidProperties(oCalc, aDeleteMandatoryPropertiesStatic);

				var oValidatedCalc = {};
				oValidatedCalc.CALCULATION_ID = genericSyntaxValidator.validateValue(oCalc.CALCULATION_ID, "PositiveInteger", undefined, true);
				aValidatedCalcs.push(oValidatedCalc);
			});
			return aValidatedCalcs;
		}
		
		function validateUpdateRequest() {
			var aCalcs = utils.tryParseJson(oRequest.body.asString());
			var aValidatedCalcs = [];
			
			_.each(aCalcs, function(oCalc) {
				aValidatedCalcs.push(utils.checkEntity({
					entity : oCalc,
					categoryId : -1,
					subitemState : -1,
					metadata : metadataProvider.get(BusinessObjectTypes.Calculation, BusinessObjectTypes.Calculation, null, null, oPersistency,
						$.getPlcUsername(), $.getPlcUsername())
				}));
			});
			return aValidatedCalcs;
		}

		function validateCreateRequest() {
			var aCalcs = utils.tryParseJson(oRequest.body.asString());
			var oCalculationMetadata = metadataProvider.get(BusinessObjectTypes.Calculation, BusinessObjectTypes.Calculation, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());
			var oCalculationVersionMetadata = metadataProvider.get(BusinessObjectTypes.CalculationVersion, BusinessObjectTypes.CalculationVersion, null, null,
					oPersistency, $.getPlcUsername(), $.getPlcUsername());
			var oItemMetadata = metadataProvider.get(BusinessObjectTypes.Item, BusinessObjectTypes.Item, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());
			var oItemMetadataCF = utils.extendMetadataCustomFields(oItemMetadata);
			
			var aValidatedCalcs = [];
			let aItemInvalidmasterdataReferences = [];
			_.each(aCalcs, function(oCalc) {

				utils.checkMandatoryProperties(oCalc, [ "CALCULATION_VERSIONS" ]);
				if (!(_.isArray(oCalc.CALCULATION_VERSIONS) && oCalc.CALCULATION_VERSIONS.length === 1)) {
					const sLogMessage = "Calculation does not contain an array with 1 entry named CALCULATION_VERSIONS. Cannot validate.";
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}

				var oCv = oCalc.CALCULATION_VERSIONS[0];
				utils.checkMandatoryProperties(oCv, [ "ITEMS" ]);
				if (!(_.isArray(oCv.ITEMS) && oCv.ITEMS.length === 1)) {
					const sLogMessage = "Inital calculation version does not contain an array with 1 entry named ITEMS. Cannot validate.";
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
				}
				var oItem = oCv.ITEMS[0];

				// the arrays CALCULATION_VERSIONS of the calculation and ITEMS of the calculation version are not
				// maintained in metadata since they don't belong to table columns but are only used to structure the
				// data within the request object; they needed to be filtered out in order to enable a metadata-based
				// validation; the original structure is re-created after successful validation
				var oCalcToValidate = _.omit(oCalc, [ "CALCULATION_VERSIONS" ]);
				var oCvToValidate = _.omit(oCv, [ "ITEMS" ]);

				const oSyntacticallyCorrectCalculation = utils.checkEntity({
					entity : oCalcToValidate,
					categoryId : -1,
					subitemState : -1,
					metadata : oCalculationMetadata
				});
				const oSyntacticallyCorrectVersion = utils.checkEntity({
					entity: oCvToValidate,
					categoryId: -1,
					subitemState: -1,
					metadata: oCalculationVersionMetadata
				});
				const oSyntacticallyCorrectItem = utils.checkEntity({
					entity : oItem,
					categoryId : 0,
					subitemState : 0,
					metadata : oItemMetadataCF
				}) ;
				
				cvValidator.checkCostingSheetSelectedTotals(oSyntacticallyCorrectVersion, true);

				var oExistingNonTemporaryMasterdata = oPersistency.CalculationVersion.getExistingNonTemporaryMasterdata({
					project_id: oCalc.PROJECT_ID					
				});
				cvValidator.checkMasterdataReferences(oSyntacticallyCorrectVersion, oExistingNonTemporaryMasterdata);
				itemValidator.checkMasterdataReferences([oSyntacticallyCorrectItem], oExistingNonTemporaryMasterdata, oItemMetadataCF);
				
				oSyntacticallyCorrectCalculation.CALCULATION_VERSIONS = [ oSyntacticallyCorrectVersion ];
				oSyntacticallyCorrectCalculation.CALCULATION_VERSIONS[0].ITEMS = [oSyntacticallyCorrectItem];
				aValidatedCalcs.push(oSyntacticallyCorrectCalculation);
			});
			if (aItemInvalidmasterdataReferences.length > 0) {
			    var oMsgDetails = new MessageDetails();
			    oMsgDetails.invalidNonTemporaryMasterdataObj = aItemInvalidmasterdataReferences;
				const sClientMsg = `Error while checking masterdata reference. Temporary values are not allowed.`;
				const sServerMsg = `Error while checking masterdata reference. Temporary values are not allowed. For more information, please see response messages`;
				$.trace.error(sServerMsg);
				throw new PlcException(Code.GENERAL_NON_TEMPORARY_MASTERDATA_DOES_NOT_EXIST_ERROR, sClientMsg, oMsgDetails);
			}
			return aValidatedCalcs;
		}

		function validateCopyVersionRequest() {
			if(helpers.isNullOrUndefined(mValidatedParameters.id)) {
				const sLogMessage = "Parameter 'id' is missing.";
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
			}
			
			var oProject = utils.tryParseJson(oRequest.body.asString());
			utils.checkMandatoryProperties(oProject, aCopyVersionMandatoryPropertiesStatic);
			utils.checkInvalidProperties(oProject, aCopyVersionMandatoryPropertiesStatic);

			var oValidatedProject = {};
			oValidatedProject.PROJECT_ID = genericSyntaxValidator.validateValue(oProject.PROJECT_ID, "String", undefined, true);
			return oValidatedProject;
		}
	};
}
CalculationValidator.prototype = Object.create(CalculationValidator.prototype);
CalculationValidator.prototype.constructor = CalculationValidator;