package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class MetadataPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 6549871681261423030L;

    private String path;
    private String businessObject;
    private String columnId;

    public MetadataPrimaryKey() {
    }

    public MetadataPrimaryKey(String path, String businessObject, String columnId) {
        this.path = path;
        this.businessObject = businessObject;
        this.columnId = columnId;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getBusinessObject() {
        return businessObject;
    }

    public void setBusinessObject(String businessObject) {
        this.businessObject = businessObject;
    }

    public String getColumnId() {
        return columnId;
    }

    public void setColumnId(String columnId) {
        this.columnId = columnId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        MetadataPrimaryKey that = (MetadataPrimaryKey) o;

        return new EqualsBuilder()
                .append(path, that.path)
                .append(businessObject, that.businessObject)
                .append(columnId, that.columnId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(path)
                .append(businessObject)
                .append(columnId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("path", path)
                .append("businessObject", businessObject)
                .append("columnId", columnId)
                .toString();
    }
}