async function runBackgroundTask(args) {
    await $.import('xs.postinstall.xslib', 'task').runBackgroundTask(args);
}
export default {runBackgroundTask};
