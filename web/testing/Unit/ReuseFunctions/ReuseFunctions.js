sap.ui.define([
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/model/json/JSONModel",
    "sap/ui/base/ManagedObject",
    'sap/m/MessageToast',
    "sap/ui/core/mvc/Controller",
    "sap/ui/thirdparty/sinon",
    "sap/ui/thirdparty/sinon-qunit"
 ], function (ResourceModel, JSONModel, ManagedObject, MessageToast, Controller) {
    "use strict";
 
    var stub = null;
    var ReuseFunction =  {
       stubCheck: true,
 
       genericStub: function (ObjectUsed, method, returned) {
          return sinon.stub(ObjectUsed, method, function () {
             return returned !== null ? returned : true;
          });
       },
 
       StubMessageToast: function (type) {
          var MessageToastType = type === undefined ? "show" : type;
          return sinon.stub(MessageToast, MessageToastType, function () {
             return true;
          });
       },
       
       setupFragmentStub: function () {
          var FragmentStub = sinon.stub(sap.ui, "xmlfragment", function () {
             return {
                open: function () {
                   return true;
                },
                getBinding: function () {
                   return {
                      filter: function () {
                         return [];
                      }
                   };
                }
             }
          });
          return FragmentStub;
       },
 
       setupoEvent: function (value, id, parameterType, title, path, filterArray, getParameterArray, jsonObject, expectedProperty, parametersobjcet) {
          return {
             oSource: {
                getSelectedDates: function () {
                   return parametersobjcet;
                }
             },
             getParameters: function () {
                return parametersobjcet;
             },
             getParameter: function () {
                if (parameterType == "item") {
                   return {
                      getTitle: function () {
                         return title;
                      },
                      getBindingContext: function () {
                         return {
                            getPath: function () {
                               return path
                            }
                         }
                      }
                   }
                } else if (parameterType == "JsonObject") {
                   return jsonObject;
                } else if (parameterType == "listItem") {
                   return {
                      sId: "",
                      getProperty: function () {
                         return title
                      }
                   }
                } else {
                   return (getParameterArray == null ? "false" : getParameterArray);
                }
             },
             getSource: function () {
                return {
                   sId: expectedProperty,
                   getBinding: function () {
                      return {
                         filter: function () {
                            return (filterArray == null ? [] : filterArray);
                         }
                      };
                   },
                   getBindingContext: function () {
                      return {
                         getProperty: function () {
                            return expectedProperty;
                         },
                         getObject: function () {
                            return jsonObject;
                         }
                      }
                   },
                   getValue: function () {
                      return value;
                   },
 
                   getId: function () {
                      return id;
                   },
                   getProperty: function () {
                      return expectedProperty;
                   },
                   getSelected: function () {
                      return value;
                   }
                }
             }
          };
 
       },
 
       getRouterStub: function (controller, expectedAttribute, assert) {
          return sinon.stub(controller, 'getRouter', function () {
             return {
                navTo: function (actualAttribute) {
                    return ReuseFunction.matchExpectedAttributes(expectedAttribute,actualAttribute, assert)
                },
                getRoute: function (actualAttribute) {
                   return {
                      attachMatched: function () {
                        return ReuseFunction.matchExpectedAttributes(expectedAttribute,actualAttribute, assert)
                      },
                      attachPatternMatched: function () {
                        return ReuseFunction.matchExpectedAttributes(expectedAttribute,actualAttribute, assert)
                      }
                   }
                }
             }
          });
       },
 
       SetupMultipleModelsForViewStub: function (ModelArrayData) {
          var oViewStub = new ManagedObject({});
          var oDomElementStub = document.createElement("div");
          for (var i = 0; i < ModelArrayData.length; i++) {
             var oJsonModelStub = new JSONModel(ModelArrayData[i].ModelData);
             if (ModelArrayData[i].ModelName === "") {
                oViewStub.setModel(oJsonModelStub);
             }
             oViewStub.setModel(oJsonModelStub, ModelArrayData[i].ModelName);
             if (ModelArrayData[i].ModelName == "i18n") {
                oViewStub.getModel(ModelArrayData[i].ModelName).getResourceBundle = function () {
                   return {
                      getText: function () {
                         return "Test Text";
                      }
                   };
                }
             }
          }
          oViewStub.byId = function () {
             return {
                getDomRef: function () {
                   return oDomElementStub;
                }
             };
          };
          oViewStub.addDependent = function () {
             return true;
          }
          var oGetViewStub = sinon.stub(Controller.prototype, "getView").returns(oViewStub);
          return oGetViewStub;
       },
 
       SetupViewStub: function (ModelData, ModelName, expectedAttribute, assert) {
          var oJsonModelStub = new JSONModel(ModelData);
          var oViewStub = new ManagedObject({});
          var oDomElementStub = document.createElement("div");
          oViewStub.setModel(oJsonModelStub, ModelName);
          oViewStub.byId = function () {
             return {
                getDomRef: function () {
                   return oDomElementStub;
                },
                getBinding: function () {
                   return {
                      filter: function () {
                         return true;
                      },
                      sort: function () {
                         return true;
                      }
                   }
                },
             };
          };
          oViewStub.addStyleClass= function(actualAttribute){
                return ReuseFunction.matchExpectedAttributes(expectedAttribute,actualAttribute, assert);
          }
 
          oViewStub.addDependent = function () {
             return true;
          }
 
          var oGetViewStub = sinon.stub(Controller.prototype, "getView").returns(oViewStub);
          return oGetViewStub;
       },
 
       SetupMultipleModelsForOwnerComponentStub: function (ModelArrayData) {
          var oViewStub = new ManagedObject({});
          var oDomElementStub = document.createElement("div");
          for (var i = 0; i < ModelArrayData.length; i++) {
             var oJsonModelStub = new JSONModel(ModelArrayData[i].ModelData);
             if (ModelArrayData[i].ModelName === "") {
                oViewStub.setModel(oJsonModelStub);
             }
             oViewStub.setModel(oJsonModelStub, ModelArrayData[i].ModelName);
          }
          oViewStub.byId = function () {
             return {
                getDomRef: function () {
                   return oDomElementStub;
                }
             };
          };
          oViewStub.addDependent = function () {
             return true;
          }
          var oGetViewStub = sinon.stub(Controller.prototype, "getOwnerComponent").returns(oViewStub);
          return oGetViewStub;
       },
 
       SetupOwnerComponentStub: function (ModelData, ModelName) {
          var oJsonModelStub = new JSONModel(ModelData);
          var oViewStub = new ManagedObject({});
          var oDomElementStub = document.createElement("div");
          oViewStub.setModel(oJsonModelStub, ModelName);
          oViewStub.byId = function () {
             return {
                getDomRef: function () {
                   return oDomElementStub;
                }
             };
          };
          oViewStub.addDependent = function () {
             return true;
          }
          var oGetOwnerComponentStub = sinon.stub(Controller.prototype, "getOwnerComponent").returns(oViewStub);
          return oGetOwnerComponentStub;
       },
 
       SetupAjaxSuccessResponse: function (ModelData, url) {
          if (this.stubCheck) {
             stub = sinon.stub($, 'ajax');
             this.stubCheck = false;
          }
          stub.withArgs(sinon.match({
             url: url
          })).yieldsTo('success', ModelData);
       },
 
       SetupAjaxErrorResponse: function (ModelData) {
          if (this.stubCheck) {
             stub = sinon.stub($, 'ajax');
          }
          this.stubCheck = false;
          stub.yieldsTo('error', ModelData);
       },

       matchExpectedAttributes: function(expectedAttribute, actualAttribute, assert){
        if (Array.isArray(expectedAttribute)) {
            for (var i = 0; i < expectedAttribute.length; i++) {
                assert.strictEqual(expectedAttribute[i], actualAttribute[i]);
            }
         }
         assert.strictEqual(expectedAttribute, actualAttribute);;
       }
    };
    return ReuseFunction;
 });