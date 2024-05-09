package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class MetadataItemAttributesPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -349212374183051821L;

    private String path;

    private String businessObject;

    private String columnId;

    private Integer itemCategoryId;

    private Integer subitemState;

    public MetadataItemAttributesPrimaryKey() {
    }

    public MetadataItemAttributesPrimaryKey(String path, String businessObject, String columnId, Integer itemCategoryId,
                                            Integer subitemState) {
        this.path = path;
        this.businessObject = businessObject;
        this.columnId = columnId;
        this.itemCategoryId = itemCategoryId;
        this.subitemState = subitemState;
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

    public Integer getItemCategoryId() {
        return itemCategoryId;
    }

    public void setItemCategoryId(Integer itemCategoryId) {
        this.itemCategoryId = itemCategoryId;
    }

    public Integer getSubitemState() {
        return subitemState;
    }

    public void setSubitemState(Integer subitemState) {
        this.subitemState = subitemState;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(path)
                .append(businessObject)
                .append(columnId)
                .append(itemCategoryId)
                .append(subitemState)
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

        MetadataItemAttributesPrimaryKey that = (MetadataItemAttributesPrimaryKey) o;

        return new EqualsBuilder()
                .append(path, that.path)
                .append(businessObject, that.businessObject)
                .append(columnId, that.columnId)
                .append(itemCategoryId, that.itemCategoryId)
                .append(subitemState, that.subitemState)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("path", path)
                .append("businessObject", businessObject)
                .append("columnId", columnId)
                .append("itemCategoryId", itemCategoryId)
                .append("subitemState", subitemState)
                .toString();
    }
}