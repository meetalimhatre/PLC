async function runBackgroundTask(args) {
    $.import('xs.postinstall.xslib', 'task').runBackgroundTask(args);
}
export default {runBackgroundTask};
