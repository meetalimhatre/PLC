const MasterdataOverlapFixer = await $.import('xs.postinstall.xslib', 'masterdataOverlapFixer').MasterdataOverlapFixer;
(await new MasterdataOverlapFixer($.request, $.response)).fix();
export default {MasterdataOverlapFixer};
