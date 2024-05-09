package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.TagPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.sql.Timestamp;

import static com.sap.plc.backend.model.Tag.TABLE_NAME;

@Entity
@Table(name = TABLE_NAME)
public class Tag extends com.sap.plc.backend.model.Entity<Tag, TagPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_tag`";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TAG_ID")
    private Integer tagId;

    @Column(name = "TAG_NAME")
    private String tagName;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY")
    private String createdBy;

    public Tag() {
    }

    public Tag(String tagName, Timestamp createdOn, String createdBy) {
        this.tagName = tagName;
        this.createdOn = createdOn;
        this.createdBy = createdBy;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Tag tag = (Tag) o;

        return new EqualsBuilder()
                .append(tagId, tag.tagId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(tagId)
                .toHashCode();
    }
}

