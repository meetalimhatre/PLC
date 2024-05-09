const _ = $.require("lodash");
const helpers = $.require("../util/helpers");

const ProjectService = $.require("../service/projectService");
const Constants = $.require("../util/constants");
const BusinessObjectTypes = Constants.BusinessObjectTypes;

const MessageLibrary = $.require("../util/message");
const PlcException = MessageLibrary.PlcException;
const Code = MessageLibrary.Code;
const XRegExp = $.require("xregexp");
const GenericSyntaxValidator = $.require("./genericSyntaxValidator").GenericSyntaxValidator;

/**
 * This class constructs BusinessObjectValidator instances for the Project business object type. It
 * validates the data in the body of a request. For this, the validation distinguishes the different CRUD operations
 * which can be done upon the business object.
 *
 * @constructor
 */

function ProjectValidator(oPersistency, sSessionId, metadataProvider, utils) {
	var aCloseOpenDeleteMandatoryPropertiesStatic = [ "PROJECT_ID" ];

	/**
	 * This function validates the request body of the given oRequest object (instance of $.request). Depending on
	 * oRequest.method a different validation procedure is chosen.
	 *
	 * @param oRequest -
	 *            The $.request object which carries the body data
	 * @param mValidatedParameters -
	 *            Validated request parameters.
	 * @returns
	 *			{oProject} 
	 *				Validated project object
	 * @throws {ValidationException}
	 *             If the request body can not be parsed as JSON array, mandatory item properties are missing or the
	 *             property values cannot be validated against the data types provided in the meta data.
	 */
	this.validate = function(oRequest, mValidatedParameters) {
		switch (oRequest.method) {
			case $.net.http.GET:
				return validateGetRequest(oRequest);
			case $.net.http.POST:
				return validatePostRequest();
			case $.net.http.PUT:
				return validatePutRequest();
			case $.net.http.DEL:
				return validateCloseOpenDeleteRequest();
			default: {
				const sLogMessage = `Cannot validate HTTP method ${oRequest.method} on service resource ${oRequest.queryPath}`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
		}
		
		function validateGetRequest(oRequest) {
			//check the filter parameter
			checkURLParameters(oRequest.parameters);
			return utils.checkEmptyBody(oRequest.body);
		}
		
		function checkURLParameters(oParameters) {
			//check autocomplete parameter
	    	if(!helpers.isNullOrUndefined(oParameters.get("searchAutocomplete"))){
	    		var sTextFromAutocomplete = oParameters.get("searchAutocomplete");
	    		helpers.checkParameterString(sTextFromAutocomplete, Constants.RegularExpressions.AutoComplete);
	    	}
			
			//check filter parameter
	    	if(!helpers.isNullOrUndefined(oParameters.get("filter"))){
	    		var sTextFromFilter = oParameters.get("filter");
	    		
				var oMetaData = metadataProvider.get(BusinessObjectTypes.Project, BusinessObjectTypes.Project, null, null, oPersistency,
					$.getPlcUsername(), $.getPlcUsername());
	    		
	    		//get all field names from the filter string
	    		var regExFieldNames = Constants.RegularExpressions.FieldNames;
	    		var aFieldNames = [];
	    		var aRegExResult;
	    		var rPattern = XRegExp(regExFieldNames);
	    		while((aRegExResult = rPattern.exec(sTextFromFilter))!== null){
	    		    aFieldNames.push(aRegExResult[1]);
	    		}
	    		
	    		//check, if fieldnames exist in t_metadata
	    		var aValidFieldNames = _.map(oMetaData, 'COLUMN_ID');
	    		var aInvalidFieldNames = _.difference(aFieldNames, aValidFieldNames);
	    		if(aInvalidFieldNames.length>0){
	    		        var sInvalidFieldsList ='' ;
	    		        _.each(aInvalidFieldNames, function(sName){sInvalidFieldsList = sInvalidFieldsList.concat(sName,', ');});
	    		        
	    		        const sLogMessage = "Fieldname parameter contains invalid fields: "+sInvalidFieldsList.slice(0,sInvalidFieldsList.length-2);
	    		        $.trace.error(sLogMessage);
	    		        throw new PlcException(Code.GENERAL_VALIDATION_ERROR, sLogMessage);
	    		}
	    	}
		}
		
		function validateCreateRequest(){
			const oProj = utils.tryParseJson(oRequest.body.asString());
			// PATH is not part of the metadata validation. It must have a custom validation.
			utils.checkMandatoryProperties(oProj, ["PATH"]);
			validatePath(oProj.PATH);
			// Omit the PATH as it is not part of the Metadata check.
			validateBasedOnMetadata(_.omit(oProj, ["PATH"]));
			return oProj;
		}

		function validatePutRequest(){
			const oProj = utils.tryParseJson(oRequest.body.asString());
			// Validate the paths
			const oValidatedProject = validateBasedOnMetadata(_.omit(oProj, ["TARGET_PATH", "PATH"]));
			if(oProj.TARGET_PATH || oProj.PATH) {
				utils.checkMandatoryProperties(oProj, ["TARGET_PATH", "PATH"]);
				validatePath(oProj.TARGET_PATH);
				validatePath(oProj.PATH);
				oValidatedProject.TARGET_PATH = oProj.TARGET_PATH;
				oValidatedProject.PATH = oProj.PATH;
			}
			return oValidatedProject;
		}

		function validatePostRequest() {

			switch (mValidatedParameters.action) {
				case "close":
					return validateCloseOpenDeleteRequest();
				case "create":
					return validateCreateRequest();
				case "open":
					return validateCloseOpenDeleteRequest();
				case Constants.ProjectServiceParameters.action.values.calculate_lifecycle_versions:
					return validateCalculateLifecycleRequest();
				default: {
					const sLogMessage = `Unknown value for parameter action: ${mValidatedParameters.action}. Cannot validate `;
					$.trace.error(sLogMessage);
					throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
				}
			}
		}
		
		function validateCalculateLifecycleRequest(){
			if(helpers.isNullOrUndefined(mValidatedParameters.id)){
				const sLogMessage = 
				    `If parameter ${Constants.ProjectServiceParameters.action.name} is set to ${mValidatedParameters.action}, also the parameter ${Constants.ProjectServiceParameters.id.name} must be set.`;
				$.trace.error(sLogMessage);
				throw new PlcException(Code.GENERAL_UNEXPECTED_EXCEPTION, sLogMessage);
			}
			
			if (helpers.isNullOrUndefinedOrEmpty(oRequest.body) != true) {
				if  (helpers.isNullOrUndefinedOrEmpty(oRequest.body.asString()) != true) {
					var oProj = utils.tryParseJson(oRequest.body.asString());
					return oProj;
				}
			}	
		}

		function validateCloseOpenDeleteRequest() {
			var oProj = utils.tryParseJson(oRequest.body.asString());

			utils.checkMandatoryProperties(oProj, aCloseOpenDeleteMandatoryPropertiesStatic);
			utils.checkInvalidProperties(oProj, aCloseOpenDeleteMandatoryPropertiesStatic);
					
			return oProj;
		}

		function validatePath(sPath) {
			const genericSyntaxValidator = new GenericSyntaxValidator();
			genericSyntaxValidator.validateValue(sPath, "String", null, false);
			helpers.validatePath(sPath);
		}

		function validateBasedOnMetadata(oProj) {
			var oProjectMedatada = metadataProvider.get(BusinessObjectTypes.Project, BusinessObjectTypes.Project, null, null, oPersistency,
				$.getPlcUsername(), $.getPlcUsername());

			// Perform metadata and entity checks
			var oValidatedProject = utils.checkEntity({
				entity : oProj,
				categoryId : -1,
				subitemState : -1,
				metadata : oProjectMedatada
			});
			
			ProjectService.checkProjectTimes(oValidatedProject.PROJECT_ID, oValidatedProject.START_OF_PRODUCTION, oValidatedProject.END_OF_PRODUCTION);
			ProjectService.checkProjectTimes(oValidatedProject.PROJECT_ID, oValidatedProject.START_OF_PROJECT, oValidatedProject.END_OF_PROJECT);

			checkNonTemporaryMasterdataReferences(oValidatedProject);

			return oValidatedProject;
		}
	
		function checkNonTemporaryMasterdataReferences(oProject) {
			// depending if the project was already created (PUT) or is to be created (POST), the parameters must differ; getExistingNonTemporaryMasterdata needs to determine 
			// the controlling area in order to retrieve valid metadata; in case of POST, the controlling_area_id must be in the request and can handed in directly; in case 
			// of PUT the controlling_area_id might not be part of the request object, but since the data is already in t_project, a select can be used to determine the controlling area
			// also notice the prevalence of controlling_area_id over project_id (it's used in case the controlling area is updated)
			let mFunctionParameter = null;
			if(oProject.CONTROLLING_AREA_ID){
				mFunctionParameter = {
					controlling_area_id: oProject.CONTROLLING_AREA_ID
				};
			} else {
				mFunctionParameter = {
					project_id: oProject.PROJECT_ID
				};
			}
			// Check that masterdata references exist for master data that cannot be temporary (null)
			var oExistingNonTemporaryMasterdata = oPersistency.Project.getExistingNonTemporaryMasterdata(mFunctionParameter);
			utils.checkNonTemporaryMasterdataReferences(oProject, ["CONTROLLING_AREA_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.CONTROLLING_AREAS, "CONTROLLING_AREA_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["COSTING_SHEET_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.COSTING_SHEETS, "COSTING_SHEET_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["COMPONENT_SPLIT_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.COMPONENT_SPLITS, "COMPONENT_SPLIT_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["REPORT_CURRENCY_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.CURRENCIES, "CURRENCY_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["EXCHANGE_RATE_TYPE_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.EXCHANGE_RATE_TYPES, "EXCHANGE_RATE_TYPE_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["MATERIAL_PRICE_STRATEGY_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.MATERIAL_PRICE_STRATEGIES, "PRICE_DETERMINATION_STRATEGY_ID"));
			utils.checkNonTemporaryMasterdataReferences(oProject, ["ACTIVITY_PRICE_STRATEGY_ID"], oPersistency.Helper.createValueSetFromResult(oExistingNonTemporaryMasterdata.ACTIVITY_PRICE_STRATEGIES, "PRICE_DETERMINATION_STRATEGY_ID"));
			return oProject;
		}

	};
}

ProjectValidator.prototype = Object.create(ProjectValidator.prototype);
ProjectValidator.prototype.constructor = ProjectValidator;
