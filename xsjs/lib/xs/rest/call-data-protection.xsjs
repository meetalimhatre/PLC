$.response.status = $.net.http.ACCEPTED;
var iSapJobId = $.request.headers.filter(entry => {return entry.name === "x-sap-job-id"})[0].value;
var iSapScheduleId = $.request.headers.filter(entry => {return entry.name === "x-sap-job-schedule-id"})[0].value;
var iSapRunId = $.request.headers.filter(entry => {return entry.name === "x-sap-job-run-id"})[0].value;
var sSapSchedulerUrl = $.request.headers.filter(entry => {return entry.name === "x-sap-scheduler-host"})[0].value;
$.response.setBody("Running async");
$.response.followUp({
    uri:"xs.rest:data-protection-automation.xsjs",
    functionName: "erasePersonalDataAfterEndOfValidity",
    parameter: {
        jobId: iSapJobId,
        scheduleId: iSapScheduleId,
        runId: iSapRunId,
        schedulerUrl: sSapSchedulerUrl
    }
});