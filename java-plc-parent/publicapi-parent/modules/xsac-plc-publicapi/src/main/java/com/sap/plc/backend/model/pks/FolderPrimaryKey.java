package com.sap.plc.backend.model.pks;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class FolderPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 7432827113311730139L;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer folderId;

    public FolderPrimaryKey() {
    }

    public FolderPrimaryKey(Integer folderId) {
        this.folderId = folderId;
    }

    public Integer getFolderId() {
        return folderId;
    }

    public void setFolderId(Integer folderId) {
        this.folderId = folderId;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(folderId)
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

        FolderPrimaryKey that = (FolderPrimaryKey) o;

        return new EqualsBuilder()
                .append(folderId, that.folderId)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("folderId", folderId)
                .toString();
    }
}