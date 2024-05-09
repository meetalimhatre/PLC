/**
 * Timer (or stop watch) implementation for performance analysis. 
 * 
 * @constructor 
 * 
 * @param  {bool} bStart    If set to true the time measurment is started right after creating an object of this class.
 *                          If omitted or set to false, the timer object only takes the time after calling start()
 */ 
function Timer(bStart) {

    var iStartTime = null;
    
    
    /**    
     * Starts taking the time.
     */     
    this.start = function() {
        iStartTime = new Date().getTime();
    };

    
    /**    
     * Stops taking the time and return the elapsed milliseconds from the start.
     *      
     * @return {integer}  Elapsed milliseconds after starting the timer.
     */     
    this.stop = function() {
        var iStopTime = new Date().getTime();
        return iStopTime - iStartTime;
    };
    
    
    /**    
     * Stops and starts taking the time. Returns the elapsed milliseconds since the last call of start().
     * Function becomes handy if you want to measure the time of multiple business logic with the same timer object. 
     *      
     * @return {integer}  Elapsed milliseconds after starting the timer.
     */     
    this.restart = function(){
        var iStopTime = this.stop();
        this.start();
        return iStopTime;
    }


    if (bStart === true) {
        this.start();
    }

}
Timer.prototype = Object.create(Timer.prototype);
Timer.prototype.constructor = Timer;

module.exports = {
    Timer
};
