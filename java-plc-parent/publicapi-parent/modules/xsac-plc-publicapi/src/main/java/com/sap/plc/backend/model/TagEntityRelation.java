package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.TagEntityRelationPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.TagEntityRelation.TABLE_NAME;

@IdClass(TagEntityRelationPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class TagEntityRelation extends com.sap.plc.backend.model.Entity<TagEntityRelation,
        TagEntityRelationPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_entity_tags`";

    public static final String ENTITY_TYPE_CALCULATION = "C";
    public static final String ENTITY_TYPE_CALCULATION_VERSION = "V";

    @Id
    @Column(name = "TAG_ID", nullable = false)
    private Integer tagId;

    @Id
    @Column(name = "ENTITY_TYPE", nullable = false)
    private String entityType;

    @Id
    @Column(name = "ENTITY_ID", nullable = false)
    private Integer entityId;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Transient
    private String tagName;

    public TagEntityRelation() {
    }

    public TagEntityRelation(Integer tagId, String entityType, Integer entityId, Timestamp createdOn, String createdBy) {
        this.tagId = tagId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.createdOn = createdOn;
        this.createdBy = createdBy;
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

    public Timestamp getCreatedOn() {
        return createdOn;
    }

    public void setCreatedOn(Timestamp createdOn) {
        this.createdOn = createdOn;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getTagName() {
        return tagName;
    }

    public void setTagName(String tagName) {
        this.tagName = tagName;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        TagEntityRelation that = (TagEntityRelation) o;

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
}
