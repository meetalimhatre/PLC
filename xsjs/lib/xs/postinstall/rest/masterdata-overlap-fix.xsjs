const MasterdataOverlapFixer = $.import("xs.postinstall.xslib", "masterdataOverlapFixer").MasterdataOverlapFixer;
new MasterdataOverlapFixer($.request, $.response).fix();