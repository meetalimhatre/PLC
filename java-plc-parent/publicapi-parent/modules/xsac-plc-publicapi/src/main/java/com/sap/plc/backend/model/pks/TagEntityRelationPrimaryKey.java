package com.sap.plc.backend.model.pks;

import com.sap.plc.backend.model.PrimaryKey;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

public class TagEntityRelationPrimaryKey implements PrimaryKey {

    private static final long serialVersionUID = 828311613248429675L;

    private Integer tagId;
    private String entityType;
    private Integer entityId;

    public TagEntityRelationPrimaryKey() {
    }

    public TagEntityRelationPrimaryKey(Integer tagId, String entityType, Integer entityId) {
        this.tagId = tagId;
        this.entityType = entityType;
        this.entityId = entityId;
    }

    public Integer getTagId() {
        return tagId;
    }

    public void setTagId(Integer tagId) {
        this.tagId = tagId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
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

        TagEntityRelationPrimaryKey that = (TagEntityRelationPrimaryKey) o;

        return new EqualsBuilder()
                .append(tagId, that.tagId)
                .append(entityType, that.entityType)
                .append(entityId, that.entityId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(tagId)
                .append(entityType)
                .append(entityId)
                .toHashCode();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("tagId", tagId)
                .append("entityType", entityType)
                .append("entityId", entityId)
                .toString();
    }
}
