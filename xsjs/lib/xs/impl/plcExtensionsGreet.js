module.exports.GreetImpl = function ($) {

    this.greet = (oBodyData, aParameters, oServiceOutput, oPersistence) => {
        oServiceOutput.setStatus($.net.http.OK);
        oServiceOutput.setBody(`Greetings ${ $.request.headers.get('x-plc-user-id') }!`);
        return oServiceOutput;
    };
};
export default {};
