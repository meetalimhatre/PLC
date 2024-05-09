package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import java.sql.Timestamp;
import java.util.Objects;

public class ItemCategoryPKAndTimestamp extends Entity {

    private static final long serialVersionUID = 5245309192498839281L;

    private Integer itemCategoryId;
    private Integer childItemCategoryId;
    private Timestamp lastModifiedOn;

    public ItemCategoryPKAndTimestamp() {
    }

    public ItemCategoryPKAndTimestamp(Integer itemCategoryId, Integer childItemCategoryId,
                                      Timestamp lastModifiedOn) {
        this.itemCategoryId = itemCategoryId;
        this.childItemCategoryId = childItemCategoryId;
        this.lastModifiedOn = lastModifiedOn;
    }

    public Integer getItemCategoryId() {
        return itemCategoryId;
    }

    public void setItemCategoryId(Integer itemCategoryId) {
        this.itemCategoryId = itemCategoryId;
    }

    public Integer getChildItemCategoryId() {
        return childItemCategoryId;
    }

    public void setChildItemCategoryId(Integer childItemCategoryId) {
        this.childItemCategoryId = childItemCategoryId;
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

        ItemCategoryPKAndTimestamp that = (ItemCategoryPKAndTimestamp) o;

        return new EqualsBuilder()
                .append(getItemCategoryId(), that.getItemCategoryId())
                .append(getChildItemCategoryId(), that.getChildItemCategoryId())
                .append(getLastModifiedOn(), that.getLastModifiedOn())
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getItemCategoryId())
                .append(getChildItemCategoryId())
                .append(getLastModifiedOn())
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("itemCategoryId", itemCategoryId)
                .append("childItemCategoryId", childItemCategoryId)
                .append("lastModifiedOn", lastModifiedOn)
                .toString();
    }

}
