const whoAmI = "sap.plc.init:030_StandardContent";

function check(oConnection) {
	return true;   
}

function run(oConnection) {
	console.log("start insert standard data");
	var procedure = oConnection.loadProcedure('sap.plc.init::030_StandardContent');
	procedure();
	console.log("finish insert standard data");
	return true;
} 

function clean(oConnection) { 
	//The Run is either committed as a unit or rolled back, hence their is no dirty data.
	return true;
}