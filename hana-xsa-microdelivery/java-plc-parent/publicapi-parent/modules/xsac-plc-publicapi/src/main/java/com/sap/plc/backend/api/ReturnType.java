package com.sap.plc.backend.api;

public enum ReturnType {

    FULL("full"),
    IDS("ids");

    private String returnType;

    ReturnType(String returnType) {
        this.returnType = returnType;
    }

    public String getReturnType() {
        return returnType;
    }

    public void setReturnType(String type) {
        this.returnType = type;
    }
}
