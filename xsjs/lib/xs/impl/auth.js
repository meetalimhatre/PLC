module.exports.Auth = function($) {

this.hello = function(oBodyData, aParameters, oServiceOutput, oPersistency){
	oServiceOutput.setBody(`Hello ${$.getPlcUsername()} :-)`);
}

}; // end of module.exports