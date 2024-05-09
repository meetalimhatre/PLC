package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;

public class StatusPKAndTimestamp extends Entity implements PrimaryKey {

    private static final long serialVersionUID = -5266794188940504526L;
    private String statusId;
    private Timestamp lastModifiedOn;

    public StatusPKAndTimestamp(String statusId, Timestamp lastModifiedOn) {
        this.statusId = statusId;
        this.lastModifiedOn = lastModifiedOn;
    }

    public StatusPKAndTimestamp() {
    }

    public String getStatusId() {
        return statusId;
    }

    public void setStatusId(String statusId) {
        this.statusId = statusId;
    }

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        StatusPKAndTimestamp that = (StatusPKAndTimestamp) o;

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
                .append("lastModifiedOn", lastModifiedOn)
                .toString();
    }
}
