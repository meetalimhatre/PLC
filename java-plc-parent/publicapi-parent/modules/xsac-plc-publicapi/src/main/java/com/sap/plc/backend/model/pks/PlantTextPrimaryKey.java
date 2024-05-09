package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class PlantTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -4255721258800820940L;

    //region Properties
    private String plantId;
    private String language;
    private Timestamp validFrom;
    //endregion

    //region Constructors
    public PlantTextPrimaryKey() {
    }

    public PlantTextPrimaryKey(String plantId, String language, Timestamp validFrom ) {
        this.plantId = plantId;
        this.language = language;
        this.validFrom = validFrom;
    }
    //endregion

    //region Getters & Setters

    public String getPlantId() {
        return plantId;
    }

    public void setPlantId(String plantId) {
        this.plantId = plantId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Timestamp getValidFrom() { return validFrom; }

    public void setValidFrom(Timestamp validFrom) { this.validFrom = validFrom; }
    //endregion

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PlantTextPrimaryKey that = (PlantTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(plantId, that.plantId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(plantId)
                .append(language)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("plantId", plantId)
                .append("language", language)
                .append("validFrom", validFrom)
                .toString();
    }
}
