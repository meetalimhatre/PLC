sap.ui.require([],
    
    function () {
        "use strict";

         // map key and comment & map key and value
         function buildMappingsFromFile(file, mKeyToComment, mKeyToValue) {
            var rawFile = new XMLHttpRequest();
            rawFile.open("GET", file, false);
            rawFile.onreadystatechange = function () {
                if (rawFile.readyState === 4) {
                    if (rawFile.status === 200 || rawFile.status == 0) {
                        var allText = rawFile.responseText;
                        var aText = allText.split(/\r?\n/);
                        //const regex = /[\d]/g;
                        for (let i = 0; i < aText.length; i++) {
                            if (aText[i].startsWith("X")) {
                                var key = aText[i].split("=")[0];
                                var comment = aText[i - 1];
                                var value = aText[i].split("=")[1]
                                mKeyToComment.set(key, comment);
                                mKeyToValue.set(key,value);
                            }
                        }                        

                    }
                }

            }
            rawFile.send(null);
        }  

        QUnit.testDone(details => {
            const result = {
                "Module name": details.module,
                "Test name": details.name,
                "Assertions": {
                    "Total": details.total,
                    "Passed": details.passed,
                    "Failed": details.failed
                },
                "Skipped": details.skipped,
                "Todo": details.todo,
                "Runtime": details.runtime
            };

            console.log(JSON.stringify(result, null, 2));
        });       
                      
        // add new languages if new files are added too;
        // "" should always be first
        var aLanguages = ["", "_de", "_en", "_es", "_fr", "_it"];

        QUnit.module("i18 Tests");

        //start of tests
        for (let i = 0; i < aLanguages.length; i++) {
            
            var mKeyToComment = new Map();
            var mKeyToValue = new Map();
            var sCurrentLanguage = aLanguages[i];
            var sCurrentResourceFile = "i18n" + sCurrentLanguage + ".properties";

            buildMappingsFromFile("base/tools/commonUi5/i18n/" + sCurrentResourceFile, mKeyToComment, mKeyToValue); 

            if (sCurrentLanguage != "") {

                QUnit.test("The files should contain the same number of entries. " + sCurrentResourceFile, assert => {
                    assert.strictEqual(mKeyToValue.size, mKeyToValueDefault.size, "---SAME NUMBER OF ENTRIES---");
                });

                QUnit.test("Check for missing keys in " + sCurrentResourceFile, assert => {
                   
                    for (let key of mKeyToValueDefault.keys()) {
                        assert.ok(mKeyToValue.has(key), key + " not found in " + sCurrentResourceFile);
                    } 
                });

                QUnit.test("Check for extra keys in " + sCurrentResourceFile, assert => { 
                    
                    for (let key of mKeyToValue.keys()) {
                        assert.ok(mKeyToValueDefault.has(key), key + " found in " + sCurrentResourceFile + ", but missing in the default i18n.properties");
                    } 
                });

            } else {

                var mKeyToValueDefault = new Map(mKeyToValue);
            }

            QUnit.test("Check against invalid characters. " + sCurrentResourceFile, assert => {

                const sAllowedValuesCharacter = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"§$%&/()= <>|,;.:-_#'+*~^°?{[]}\\\n\r©• ";

                for (const [key, value] of mKeyToValue.entries()) {
                    for (let j = 0; j < value.length; j++) {
                        assert.ok(sAllowedValuesCharacter.includes(value[j]), "The entry -- " + key + " -- has invalid character: " + value[j]);
                    }
                }
            });           
                      

            QUnit.test("Check if the translation metadata has the right structure. " + sCurrentResourceFile, assert => {           

                for (const [key, comment] of mKeyToComment.entries()) {
                    assert.ok(comment.startsWith("#X") && comment.split(",")[0].length == 5, "The metadata for " + key + " doesn't have the correct format.");
                }
            });
    
            QUnit.test("Check if the translated text exceeds the available space in the screen. " + sCurrentResourceFile, assert => {
    
                const regex = /[\d]/g;
                for (const [key, comment] of mKeyToComment.entries()) {
                    var limit = comment.split(":")[0].match(regex);
    
                    if (limit == null) {
                        assert.ok(false, "The resource limit for " + key + " is missing.");
                    }
                    else {
                        assert.ok(mKeyToValue.get(key).length <= parseInt(limit.join(""), 10), "The translation for " + key + " exceeds the limit specified in the metadata.");
                    }
                }
            });

            QUnit.test("Check if the key from the translation metadata is the same as the one in the key. " + sCurrentResourceFile, assert => {

                for (const [key, comment] of mKeyToComment.entries())
                {
                    assert.ok(key.substring(0,4) == comment.substring(1,5), "The resource type in the metadata is not the same as the one in the key " + key);
                }
            });
        }
    }
);