package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class ActivityTypePrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8669666209487082101L;
    private String activityTypeId;
    private String controllingAreaId;
    private Timestamp validFrom;

    public ActivityTypePrimaryKey() {
    }

    public ActivityTypePrimaryKey(String activityTypeId, String controllingAreaId, Timestamp validFrom) {
        this.activityTypeId = activityTypeId;
        this.controllingAreaId = controllingAreaId;
        this.validFrom = validFrom;
    }

    public String getActivityTypeId() {
        return activityTypeId;
    }

    public void setActivityTypeId(String activityTypeId) {
        this.activityTypeId = activityTypeId;
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

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(activityTypeId)
                .append(controllingAreaId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ActivityTypePrimaryKey that = (ActivityTypePrimaryKey) o;

        return new EqualsBuilder()
                .append(activityTypeId, that.activityTypeId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("activityTypeId", activityTypeId)
                .append("controllingAreaId", controllingAreaId)
                .append("validFrom", validFrom)
                .toString();
    }
}
