const Metadata = $.require('../impl/metadata').Metadata;

async function metadata(mParameters) {

    var iTaskId = mParameters.TASK_ID;
    var aBodyMeta = mParameters.A_BODY_META;
    var oParameters = mParameters.PARAMETERS;

    (await new Metadata($)).batchCreateUpdateDelete(iTaskId, aBodyMeta, oParameters);
}
export default {Metadata,metadata};
