package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class ItemCategoryPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 6376091174243399386L;

    private Integer itemCategoryId;
    private Integer childItemCategoryId;

    public ItemCategoryPrimaryKey(Integer itemCategoryId, Integer childItemCategoryId) {
        this.itemCategoryId = itemCategoryId;
        this.childItemCategoryId = childItemCategoryId;
    }

    public ItemCategoryPrimaryKey() {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ItemCategoryPrimaryKey that = (ItemCategoryPrimaryKey) o;

        return new EqualsBuilder()
                .append(getItemCategoryId(), that.getItemCategoryId())
                .append(getChildItemCategoryId(), that.getChildItemCategoryId())
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getItemCategoryId())
                .append(getChildItemCategoryId())
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("itemCategoryId", itemCategoryId)
                .append("childItemCategoryId", childItemCategoryId)
                .toString();
    }

}
