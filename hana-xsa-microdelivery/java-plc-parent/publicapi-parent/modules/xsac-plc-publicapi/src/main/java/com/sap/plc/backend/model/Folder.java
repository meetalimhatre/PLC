package com.sap.plc.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.hibernate.annotations.GenericGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.SecondaryTable;
import jakarta.persistence.Table;
import java.sql.Timestamp;
import java.util.Date;

@Entity
@Table(name = Folder.TABLE_NAME)
@SecondaryTable(name = EntityRelationView.TABLE_NAME, pkJoinColumns = @PrimaryKeyJoinColumn(name = "RESULT_NODE"))
@JsonIgnoreProperties(ignoreUnknown = true)
public class Folder extends com.sap.plc.backend.model.Entity<Folder, Integer> {

    public static final String TABLE_NAME_NO_QUOTES = "sap.plc.db::basis.t_folder";

    public static final String TABLE_NAME = "`" + TABLE_NAME_NO_QUOTES + "`";

    private static final long serialVersionUID = 3224731006901722418L;

    @Id
    @Column(name = "ENTITY_ID", nullable = false)
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ENTITY_SEQUENCE")
    @GenericGenerator(name = "ENTITY_SEQUENCE",
            strategy = "com.sap.plc.backend.model.sequencegenerator.EntityRelationSequenceStyleGenerator")
    private Integer folderId;

    @Column(name = "FOLDER_NAME", nullable = false, length = 100)
    private String folderName;

    @Column(name = "CREATED_ON", nullable = false)
    private Timestamp createdOn;

    @Column(name = "CREATED_BY", nullable = false, length = 100)
    private String createdBy;

    @Column(name = "MODIFIED_ON", nullable = false)
    private Timestamp modifiedOn;

    @Column(name = "MODIFIED_BY", nullable = false, length = 100)
    private String modifiedBy;

    @Column(name = "IS_LEAF", length = 1, updatable = false, insertable = false, table = EntityRelationView.TABLE_NAME)
    private Integer isLeaf;

    @Column(name = "PATH", length = 5000, updatable = false, insertable = false, table = EntityRelationView.TABLE_NAME)
    private String path;

    @Column(name = "PRED_NODE", updatable = false, insertable = false, table = EntityRelationView.TABLE_NAME)
    private Integer parentId;

    @Column(name = "PARENT_ENTITY_TYPE", updatable = false, insertable = false, table = EntityRelationView.TABLE_NAME)
    private String parentType;

    public Folder(Integer folderId, String folderName, Date createdOn, String createdBy, Integer isLeaf, String path) {
        this.folderId = folderId;
        this.folderName = folderName;
        this.createdOn = new Timestamp(createdOn.getTime());
        this.createdBy = createdBy;
        this.isLeaf = isLeaf;
        this.path = path;
    }

    public Folder(String folderName) {
        this.folderName = folderName;
    }

    public Folder(Integer folderId) {
        this.folderId = folderId;
    }

    public Folder() {
    }

    public Integer getIsLeaf() {
        return isLeaf;
    }

    public void setIsLeaf(Integer isLeaf) {
        this.isLeaf = isLeaf;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public Timestamp getModifiedOn() {
        return modifiedOn;
    }

    public void setModifiedOn(Timestamp modifiedOn) {
        this.modifiedOn = modifiedOn;
    }

    public String getModifiedBy() {
        return modifiedBy;
    }

    public void setModifiedBy(String modifiedBy) {
        this.modifiedBy = modifiedBy;
    }

    public Integer getFolderId() {
        return folderId;
    }

    public void setFolderId(Integer folderId) {
        this.folderId = folderId;
    }

    public String getFolderName() {
        return folderName;
    }

    public void setFolderName(String folderName) {
        this.folderName = folderName;
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

    public String getParentType() {
        return parentType;
    }

    public void setParentType(String parentType) {
        this.parentType = parentType;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(folderId)
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

        Folder folder = (Folder) o;

        return new EqualsBuilder()
                .append(folderId, folder.folderId)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("folderId", folderId)
                .append("folderName", folderName)
                .toString();
    }
}
