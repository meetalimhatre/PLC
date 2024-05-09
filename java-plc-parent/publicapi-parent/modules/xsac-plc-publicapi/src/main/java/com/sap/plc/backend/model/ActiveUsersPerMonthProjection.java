package com.sap.plc.backend.model;

public interface ActiveUsersPerMonthProjection {

    Integer getYear();

    Integer getMonth();

    Integer getCount();
}
