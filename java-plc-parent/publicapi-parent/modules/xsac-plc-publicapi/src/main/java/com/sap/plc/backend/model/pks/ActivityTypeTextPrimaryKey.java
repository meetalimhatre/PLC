package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class ActivityTypeTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8669666209487082101L;
    private String activityTypeId;
    private String controllingAreaId;
    private String language;
    private Timestamp validFrom;

    public ActivityTypeTextPrimaryKey() {
    }

    public ActivityTypeTextPrimaryKey(String activityTypeId, String controllingAreaId, String language,
                                      Timestamp validFrom) {
        this.activityTypeId = activityTypeId;
        this.controllingAreaId = controllingAreaId;
        this.language = language;
        this.validFrom = validFrom;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
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
                .append(language)
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

        ActivityTypeTextPrimaryKey that = (ActivityTypeTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(activityTypeId, that.activityTypeId)
                .append(controllingAreaId, that.controllingAreaId)
                .append(language, that.language)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("activityTypeId", activityTypeId)
                .append("controllingAreaId", controllingAreaId)
                .append("language", language)
                .append("validFrom", validFrom)
                .toString();
    }
}
