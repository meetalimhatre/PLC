// Reusable trace methods

// Trace entries will be triggered if the condition at the end of the log calls
// is false. If there is no condition this will implicitly assumed to be false.

// Trace implies that the content is intended for developers. It also implies
// that the messages may or may not be meaningless to anyone but developers. 

// Due to the fact that at this time no dedicated log facility exists the
// log and the traces will end up in the same file. It is hence recommended
// that developers stick to "d" level trace entries.


var gc_level = {fatal: 'F', info: 'I', warning: 'W', error: 'E', debug: 'D'};
var gc_levelPriority = {F:1, E:2, W:3, I:4, D:5, f:1, e:2, w:3, i:4, d:5};

// used to buffer the contents of the trace sections
// this is only required because current DB access performance is poor
var groupBuffer;

var transientTrace;

//do not write any trace entries anywhere
//collect them in memory instead
function setTransientMode(level) {
     transientTrace = transientTrace || {entries: "", level: level.debug};
     transientTrace.level = level || transientTrace.level; 
}

//get transient trace entries
function getTransientTrace() {
     return transientTrace.entries;
}

function addTransientGroup(group, level) {
    var line = {};
    if (line && group) {
        line.group = group;
        line.level = level[0].toLowerCase();
        if (line.group.length > 0 && line.level.length > 0) {
            // only use the first letter, e.g. "error" would be mapped to "e"
            line.priority = gc_levelPriority[line.level[0]];
            groupBuffer.push(line);
        }
    }
}

function setTransientGroup(group, level) { 
     groupBuffer = [];
     addTransientGroup(group, level);
}

function staticGroupBufferInitializer() {
    if (!groupBuffer) {
        // prefix buffer not yet filled, fill it from DB
        groupBuffer = [];

        var conn = $.db.getConnection();
        // join("  ") on purpose to mitigate parser issue
        var ps = conn.prepareStatement(
                "select key, value from m_inifile_contents"+ 
                "    where"+
                "        file_name = 'xsengine.ini' and"+
                "        section   = 'inoTrace'  "
                /* 
                +
                "union  "+
                'select key, value from "sap.plc.db.basis::v_user_parameter"'+
                "    where"+
                "        user_name = current_user and"+
                "        section = 'inoTrace'"
                */
                );
        ps.execute();
        var result = ps.getResultSet();

        var line;
        while (result.next()) {
            line = {};
            line.group = result.getString(1);
            line.level = result.getString(2)[0].toLowerCase();
            if (line.group.length > 0 && line.level.length > 0) {
                // only use the first letter, e.g. "error" would be mapped to "e"
                line.priority = gc_levelPriority[line.level[0]];
                groupBuffer.push(line);
            }
        }
        ps.close();
    }
}
staticGroupBufferInitializer();


function trace(level, group, comment, condition) {
    function isFunction(input) { return ($.toString.call(input)==='[object Function]'); }

    function isTraceActive(level, group) {
        var priority = gc_levelPriority[level];
        var i;
        var line;
        for (i = 0; i < groupBuffer.length; ++i) {
            line = groupBuffer[i];
            if (line.group === group.substring(0, line.group.length)) {
                if (priority <= line.priority) {
                    return true;
                } 
            }
        }
        return false;
    }

    // only use the first letter, e.g. "error" would be mapped to "e"
    var theLevel = level[0];
    if (isTraceActive(theLevel, group)) {
        var everythingOK = isFunction(condition)? condition(): condition;
        if (!everythingOK) {
            var output;
            if (isFunction(comment)) {
                output = "[" + group + "]: " + comment();
            } else {
                output = "[" + group + "]: " + comment;
            }
            if (transientTrace) {
                transientTrace.entries += "[" + level + "]: " + output + "\r\n";
            } else {
                switch (theLevel) {
                    case gc_level.debug  : $.trace.debug(output);     break;
                    case gc_level.info   : $.trace.info(output);      break;
                    case gc_level.warning: $.trace.warning(output);   break;
                    case gc_level.error  : $.trace.error(output);     break;
                    case gc_level.fatal  : $.trace.fatal(output);     break;

                    default: $.trace.debug(output);
                }
            }
        }
    }
}


function debug(group, comment, condition) {
    trace(gc_level.debug, group, comment, condition);
}

function info(group, comment, condition) {
    trace(gc_level.info, group, comment, condition);
}

function warning(group, comment, condition) {
    trace(gc_level.warning, group, comment, condition);
}

function error(group, comment, condition) {
    trace(gc_level.error, group, comment, condition);
}

function fatal(group, comment, condition) {
    trace(gc_level.fatal, group, comment, condition);
}

function assert(group, comment, condition) {
    trace(gc_level.fatal, group, comment, condition);
}