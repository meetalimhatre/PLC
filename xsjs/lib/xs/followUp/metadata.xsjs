const Metadata = $.require('../impl/metadata').Metadata;

function metadata(mParameters) {

    var iTaskId = mParameters.TASK_ID;
    var aBodyMeta = mParameters.A_BODY_META;
    var oParameters = mParameters.PARAMETERS;

    new Metadata($).batchCreateUpdateDelete(iTaskId, aBodyMeta, oParameters);
}
export default {Metadata,metadata};
