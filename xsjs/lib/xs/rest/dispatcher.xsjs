const DispatcherLib = $.require("../impl/dispatcher");
const Dispatcher = DispatcherLib.Dispatcher;
const ctx = DispatcherLib.prepareDispatch($);

new Dispatcher(ctx, $.request, $.response).dispatch(true);