package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class StatusTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 5382334264269861001L;

    private String statusId;
    private String language;

    public StatusTextPrimaryKey() {
    }

    public StatusTextPrimaryKey(String statusId, String language) {
        this.statusId = statusId;
        this.language = language;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        StatusTextPrimaryKey that = (StatusTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(statusId, that.statusId)
                .append(language, that.language)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(statusId)
                .append(language)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("statusId", statusId)
                .append("language", language)
                .toString();
    }
}
