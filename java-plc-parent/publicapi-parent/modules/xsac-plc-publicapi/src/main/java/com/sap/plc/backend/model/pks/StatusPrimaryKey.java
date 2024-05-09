package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class StatusPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -8036562798145906005L;

    private String statusId;

    public StatusPrimaryKey(String statusId) {
        this.statusId = statusId;
    }

    public StatusPrimaryKey() {
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

        StatusPrimaryKey that = (StatusPrimaryKey) o;

        return new EqualsBuilder()
                .append(statusId, that.statusId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(statusId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("statusId", statusId)
                .toString();
    }
}
