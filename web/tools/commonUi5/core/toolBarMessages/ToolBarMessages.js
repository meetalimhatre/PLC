sap.ui.define([
    "sap/ui/core/Fragment",
], function (Fragment) {
    "use strict";

    var oMessagePopover= null;
    var initialised = false;

    var toolBarMessages = {

        initialiseMessagePopover: function () {
            if (initialised == false) {
                initialised = true;
                var oView = this.getView();
                oView.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
    
                Fragment.load({
                    id: oView.getId(),
                    name: "core.toolBarMessages.MessagePopover",
                    controller: this
                }).then(function(oFragment){
                    oView.addDependent(oFragment);
                    oMessagePopover = oFragment;
                });
            }
        },

        removeAllMessages: function(){
            sap.ui.getCore().getMessageManager().removeAllMessages();
        },

        onMessagePopoverPress: function (oEvent) {
            oMessagePopover.openBy(oEvent.getSource());
        },
    }
    return toolBarMessages;
});