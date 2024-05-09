package com.sap.plc.backend.model;

import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = EntityRelation.TABLE_NAME)
public class EntityRelation {

    public static final String TABLE_NAME_NO_QUOTES = "sap.plc.db::basis.t_entity_relation";

    public static final String TABLE_NAME = "`" + TABLE_NAME_NO_QUOTES + "`";

    public static final String SEQUENCE_NAME = "`sap.plc.db.sequence::s_entity_id`";

    @Id
    @Column(name = "ENTITY_ID", nullable = false)
    private Integer entityId;

    @Column(name = "PARENT_ENTITY_ID")
    private Integer parentId;

    @Column(name = "ENTITY_TYPE", nullable = false, length = 1)
    private String entityType;

    public EntityRelation() {
    }

    public EntityRelation(Integer entityId) {
        this.entityId = entityId;
    }

    public Integer getEntityId() {
        return entityId;
    }

    public void setEntityId(Integer entityId) {
        this.entityId = entityId;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(entityId)
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

        EntityRelation entityRelation = (EntityRelation) o;

        return new EqualsBuilder()
                .append(entityId, entityRelation.entityId)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("entityId", entityId)
                .append("parentId", parentId)
                .append("entityType", entityType)
                .toString();
    }
}
