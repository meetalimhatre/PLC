sap.ui.define(
    [
        "Integration/retentionPeriods/pageObjects/button_Add",
        "Integration/retentionPeriods/pageObjects/addEditRetentionPeriodDialog",
        "Integration/retentionPeriods/pageObjects/addEditDialogEntity",
        "Integration/retentionPeriods/pageObjects/entityTypes",
        "Integration/retentionPeriods/pageObjects/addEditDialogEntityId",
        "Integration/retentionPeriods/pageObjects/addEditDialogEntityIdInput",
        "Integration/retentionPeriods/pageObjects/addEditDialogValidTo",
        "Integration/retentionPeriods/pageObjects/addEditDialogValidFor",
        "Integration/retentionPeriods/pageObjects/addSaveButton",
        "Integration/retentionPeriods/pageObjects/addEditDialogValidToDatePickers",
        "Integration/retentionPeriods/pageObjects/addEditDialogValidForStepInput",
    ],
    function (button_Add, addEditRetentionPeriodDialog, addEditDialogEntity, entityTypes, addEditDialogEntityId, addEditDialogEntityIdInput, addEditDialogValidTo,
        addEditDialogValidFor,addSaveButton, addEditDialogValidToDatePickers, addEditDialogValidForStepInput) {
        "use strict";
        return {
            button_Add: button_Add,
            addEditRetentionPeriodDialog: addEditRetentionPeriodDialog,
            addEditDialogEntity: addEditDialogEntity,
            entityTypes: entityTypes,
            addEditDialogEntityId: addEditDialogEntityId,
            addEditDialogEntityIdInput: addEditDialogEntityIdInput,
            addEditDialogValidTo: addEditDialogValidTo,
            addEditDialogValidFor: addEditDialogValidFor,
            addSaveButton: addSaveButton,
            addEditDialogValidToDatePickers: addEditDialogValidToDatePickers,
            addEditDialogValidForStepInput:addEditDialogValidForStepInput
        }

    });