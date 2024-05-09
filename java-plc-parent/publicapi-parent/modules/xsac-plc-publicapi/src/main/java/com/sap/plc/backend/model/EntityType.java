package com.sap.plc.backend.model;

public enum EntityType {

    FOLDER("F"),
    PROJECT("P"),
    CALCULATION("C");

    private String type;

    EntityType(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
