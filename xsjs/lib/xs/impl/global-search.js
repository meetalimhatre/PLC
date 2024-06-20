module.exports.GlobalSearch = function ($) {

    var sUserId = $.getPlcUsername();


    /**
 * Handles a GET request towards the globalSearch.xsjs resource to get the projects , calculation and calculation-versions. It can return data for all objects or only for
 * one entity, dependent on the request parameter type.
 * 
 * @returns {ServiceOutput} - an instance of the ServiceOutput which encapsulates the payload produced by this method.
 */
    this.get = async function (oBodyData, aParameters, oServiceOutput, oPersistency) {
        var sSortedColumnId = aParameters.sortedColumnId;
        var sSortedDirection = aParameters.sortedDirection;
        var sFilter = aParameters.filter;
        var sType = aParameters.type;
        var iTop = aParameters.top;
        var oBody = {};

        oBody.GLOBAL_SEARCH = await oPersistency.GlobalSearch.get(sSortedColumnId, sSortedDirection, sFilter, sType, iTop, sUserId);

        oServiceOutput.setBody(oBody);
    };

}; // end of module.exports.GlobalSearch
export default {};
