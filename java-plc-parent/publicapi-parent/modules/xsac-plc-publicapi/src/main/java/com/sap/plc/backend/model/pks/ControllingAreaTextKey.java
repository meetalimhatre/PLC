package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;
import java.util.Objects;

public class ControllingAreaTextKey implements PrimaryKey {

    private static final long serialVersionUID = -6630151897826966517L;

    private String controllingAreaId;
    private Timestamp validFrom;
    private String language;

    public ControllingAreaTextKey(String controllingAreaId, Timestamp validFrom, String language) {
        this.controllingAreaId = controllingAreaId;
        this.validFrom = validFrom;
        this.language = language;
    }

    public ControllingAreaTextKey() {
    }

    public static long getSerialVersionUID() {
        return serialVersionUID;
    }

    public String getControllingAreaId() {
        return controllingAreaId;
    }

    public void setControllingAreaId(String controllingAreaId) {
        this.controllingAreaId = controllingAreaId;
    }

    public Timestamp getValidFrom() {
        return validFrom;
    }

    public void setValidFrom(Timestamp validFrom) {
        this.validFrom = validFrom;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (o == null || getClass() != o.getClass()) {
            return false;
        }
        ControllingAreaTextKey that = (ControllingAreaTextKey) o;
        return Objects.equals(controllingAreaId, that.controllingAreaId) &&
                Objects.equals(validFrom, that.validFrom) &&
                Objects.equals(language, that.language);
    }

    @Override
    public int hashCode() {
        return Objects.hash(controllingAreaId, validFrom, language);
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("controllingAreaId", controllingAreaId)
                .append("validFrom", validFrom)
                .append("language", language)
                .toString();
    }
}
