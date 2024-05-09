package com.sap.plc.backend.model;

import java.util.Arrays;

public enum LifecycleDistributionType {
    QUANTITY(0),
    EQUAL(1),
    MANUAL(2);

    private int value;
    LifecycleDistributionType(int value) {
        this.value = value;
    }
    public int getValue() {
        return value;
    }

    public static LifecycleDistributionType getByValue(int value) {
        return Arrays.stream(values())
                     .filter(enumValue -> enumValue.getValue() == value)
                     .findAny()
                     .orElse(null);
    }
}
