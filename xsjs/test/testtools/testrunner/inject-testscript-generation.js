// inject additional dynamic database artefacts into DbArtefactController (just for plc_test project)
const metadataLibrary = require("../../../lib/xs/db/generation/custom_fields_metadata");

let mDbArtefactsMetadata = metadataLibrary.mDbArtefactsMetadata;
let mBusinessObjectsMetadata = metadataLibrary.mBusinessObjectsMetadata;

function addGenerationArtefact(sName, oDetails) {
    // only add new artefact if it does not exist yet (to prevent clashes with changes in productive code)
    if (mBusinessObjectsMetadata.Item.dependencies.indexOf(sName) === -1 &&	mDbArtefactsMetadata[sName] === undefined) {
        mBusinessObjectsMetadata.Item.dependencies.push(sName);
        mDbArtefactsMetadata[sName] = oDetails;
    }
}

function injectMetadataLibrary() {
    addGenerationArtefact("p_recalculate_all_saved_calculation_versions",
	{
		"name": "sap.plc_test.testtools.calculation::p_recalculate_all_saved_calculation_versions",
		"type": "SQLScript",
		"packageName": "testtools.calculation",
		"templateName": "p_recalculate_all_saved_calculation_versions.hdbprocedure.template",
		"boDependencies": ["Item"],
		"dependencies": ["p_calculate_saved_calculation_version"]
	});

    addGenerationArtefact("p_recalculate_all_versions_sequentially",
	{
		"name": "sap.plc_test.testtools.calculation::p_recalculate_all_versions_sequentially",
		"type": "SQLScript",
		"packageName": "testtools.calculation",
		"templateName": "p_recalculate_all_versions_sequentially.hdbprocedure.template",
		"boDependencies": ["Item"],
		"dependencies": ["p_recalculate_calculation_versions_sequentially"]
	});

    addGenerationArtefact("p_recalculate_all_versions_of_project_sequentially",
	{
		"name": "sap.plc_test.testtools.calculation::p_recalculate_all_versions_of_project_sequentially",
		"type": "SQLScript",
		"packageName": "testtools.calculation",
		"templateName": "p_recalculate_all_versions_of_project_sequentially.hdbprocedure.template",
		"boDependencies": ["Item"],
		"dependencies": ["p_recalculate_calculation_versions_sequentially"]
	});

    addGenerationArtefact("p_recalculate_calculation_versions_sequentially",
		{
			"name": "sap.plc_test.testtools.calculation::p_recalculate_calculation_versions_sequentially",
			"type": "SQLScript",
			"packageName": "testtools.calculation",
			"templateName": "p_recalculate_calculation_versions_sequentially.hdbprocedure.template",
			"boDependencies": ["Item"],
			"dependencies": ["p_calculate_saved_calculation_version"]
		});
}

module.exports.injectMetadataLibrary = injectMetadataLibrary;
