sap.ui.define(
    [
        "Integration/bomCompare/pageObjects/compare",
        "Integration/bomCompare/pageObjects/CalVersionInput1",
        "Integration/bomCompare/pageObjects/CalVersionInput2",
        "Integration/bomCompare/pageObjects/frmTitle",
        "Integration/bomCompare/pageObjects/lblPrimaryCalcVersion",
        "Integration/bomCompare/pageObjects/lblSecondaryCalcVersion",
        "Integration/bomCompare/pageObjects/tblAccessibilitySwitch",
        "Integration/bomCompare/pageObjects/txtSelectedLayout",
        "Integration/bomCompare/pageObjects/btnSettingsMenu",
        "Integration/bomCompare/pageObjects/btnSettingsMenuOption",
        "Integration/bomCompare/pageObjects/btnSaveLayout",
        "Integration/bomCompare/pageObjects/btnExportExcel",
        "Integration/bomCompare/pageObjects/messagePopoverBox",
        "Integration/bomCompare/pageObjects/treeTable",
        "Integration/bomCompare/pageObjects/buttonMessagePopover",
        "Integration/bomCompare/pageObjects/btnExcelExportMenu",
        "Integration/bomCompare/pageObjects/btnExcelExportMenuOption",
        "Integration/bomCompare/pageObjects/export"
    ],
    function (compare, CalVersionInput1, CalVersionInput2, frmTitle, lblPrimaryCalcVersion, lblSecondaryCalcVersion,
        tblAccessibilitySwitch, txtSelectedLayout, btnSettingsMenu, btnSettingsMenuOption, btnSaveLayout, btnExportExcel, messagePopoverBox, treeTable,
        buttonMessagePopover, btnExcelExportMenu, btnExcelExportMenuOption, oExport) {
        "use strict";
        return {
            compare: compare,
            CalVersionInput1: CalVersionInput1,
            CalVersionInput2: CalVersionInput2,
            frmTitle: frmTitle,
            lblPrimaryCalcVersion: lblPrimaryCalcVersion,
            lblSecondaryCalcVersion: lblSecondaryCalcVersion,
            tblAccessibilitySwitch: tblAccessibilitySwitch,
            txtSelectedLayout: txtSelectedLayout,
            btnSettingsMenu: btnSettingsMenu,
            btnSettingsMenuOption: btnSettingsMenuOption,
            btnSaveLayout: btnSaveLayout,
            btnExportExcel: btnExportExcel,
            messagePopoverBox: messagePopoverBox,
            treeTable: treeTable,
            buttonMessagePopover: buttonMessagePopover,
            btnExcelExportMenu: btnExcelExportMenu,
            btnExcelExportMenuOption: btnExcelExportMenuOption,
            oExport: oExport
        }

    });