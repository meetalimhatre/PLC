const fs = require('fs');
const _  = require('lodash');


function parse(src)
{
    var obj = {}

    // convert Buffers before splitting into lines and processing
    src.toString().split('\n').forEach(function (line)
    {
        // matching "KEY' and 'VAL' in 'KEY=VAL'
        var keyValueArr = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/)
        // matched?
        if (keyValueArr != null)
        {
            var key = keyValueArr[1]

            // default undefined or missing values to empty string
            var value = keyValueArr[2] || ''

            // expand newlines in quoted values
            var len = value ? value.length : 0
            if (len > 0 && value.charAt(0) === '"' && value.charAt(len - 1) === '"')
            {
                value = value.replace(/\\n/gm, '\n')
            }

            // remove any surrounding quotes and extra spaces
            value = value.replace(/(^['"]|['"]$)/g, '').trim()

            obj[key] = value
        }
    })

    return obj;
}

/**
 * load test config file and parse file content, return a JSON Object
 * @options {path: 'test config file path', encoding: 'utf8'}
 */
module.exports.loadSetting = function (options)
{
    const path = _.get(options, 'path') || '.test';
    const encoding = _.get(options, 'encoding') || 'utf8';

    try
    {
        return parse(fs.readFileSync(path, { encoding: encoding }));
    } catch (e)
    {
        console.log(e.message);
        throw e
    }
}



