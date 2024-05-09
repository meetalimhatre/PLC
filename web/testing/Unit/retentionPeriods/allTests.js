sap.ui.loader.config({
    paths: {
      "retentionPeriodsTests": "/base/testing/Unit/retentionPeriods",
      "retentionperiods/ui": "/base/tools/retentionPeriods",
      "core": "/base/tools/commonUi5/core",
      "ReuseFunctions": "/base/testing/Unit/ReuseFunctions"
    }
  });

sap.ui.define([
    "retentionPeriodsTests/controller/Home.controller",
    "retentionPeriodsTests/controller/App.controller"
], function() {
    "use strict";
});