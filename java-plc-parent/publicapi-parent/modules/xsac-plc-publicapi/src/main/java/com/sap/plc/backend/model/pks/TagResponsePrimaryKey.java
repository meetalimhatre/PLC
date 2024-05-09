package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class TagResponsePrimaryKey implements PrimaryKey {
    private Integer tagId;
    private String tagName;
    private Integer entityId;

    public TagResponsePrimaryKey(Integer tagId, String tagName, Integer entityId) {
        this.tagId = tagId;
        this.tagName = tagName;
        this.entityId = entityId;
    }

    public TagResponsePrimaryKey() {
    }

    public Integer getTagId() {
        return tagId;
    }

    public void setTagId(Integer tagId) {
        this.tagId = tagId;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        TagResponsePrimaryKey that = (TagResponsePrimaryKey) o;

        return new EqualsBuilder()
                .append(tagId, that.tagId)
                .append(tagName, that.tagName)
                .append(entityId, that.entityId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(tagId)
                .append(tagName)
                .append(entityId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("tagId", tagId)
                .append("tagName", tagName)
                .append("entityId", entityId)
                .toString();
    }
}
