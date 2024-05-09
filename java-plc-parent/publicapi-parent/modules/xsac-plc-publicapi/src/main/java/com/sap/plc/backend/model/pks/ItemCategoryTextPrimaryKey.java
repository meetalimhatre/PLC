package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class ItemCategoryTextPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = -6329885589359956439L;

    private Integer itemCategoryId;
    private Integer childItemCategoryId;
    private String language;

    public ItemCategoryTextPrimaryKey() {
    }

    public ItemCategoryTextPrimaryKey(Integer itemCategoryId, Integer childItemCategoryId, String language) {
        this.itemCategoryId = itemCategoryId;
        this.childItemCategoryId = childItemCategoryId;
        this.language = language;
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

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ItemCategoryTextPrimaryKey that = (ItemCategoryTextPrimaryKey) o;

        return new EqualsBuilder()
                .append(getItemCategoryId(), that.getItemCategoryId())
                .append(getChildItemCategoryId(), that.getChildItemCategoryId())
                .append(getLanguage(), that.getLanguage())
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getItemCategoryId())
                .append(getChildItemCategoryId())
                .append(getLanguage())
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("itemCategoryId", itemCategoryId)
                .append("childItemCategoryId", childItemCategoryId)
                .append("language", language)
                .toString();
    }

}
