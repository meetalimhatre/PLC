package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Transient;
import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

@MappedSuperclass
public abstract class Masterdata<TEntity extends Masterdata<TEntity, TEntityId>, TEntityId extends PrimaryKey>
        extends Entity<TEntity, TEntityId> {

    private static final long serialVersionUID = 1116120617624417669L;
    private static final Integer DEFAULT_SOURCE = 1;

    @Column(name = "_SOURCE", length = 3)
    protected Integer source;

    @Column(name = "_CREATED_BY", length = 256, updatable = false)
    protected String createdBy;

    @Id
    @Column(name = "_VALID_FROM", nullable = false, length = 27)
    protected Timestamp validFrom;

    @Column(name = "_VALID_TO", length = 27)
    protected Timestamp validTo;

    @Transient
    protected Map<String, Object> customFields = new HashMap<>();

    public abstract String getEntityId();

    public abstract String getUniqueQuery();

    @PrePersist
    public void setDefaults() {
        if (source == null) {
            source = DEFAULT_SOURCE;
        }
    }

    public void addCustomField(String key, String value) {
        this.customFields.put(key, value);
    }

    public Map<String, Object> getCustomFields() {
        return this.customFields;
    }

    public void setCustomFields(Map<String, Object> customFields) {
        this.customFields = customFields;
    }

    public abstract Map getTextsMap();

    public abstract void setTextsMap(Map<String, Object> textsMap);

    public String getExtensionTableName() {
        return null;
    }

    public abstract boolean idEquals(Object o);

    public abstract String getMetadataBusinessObjectAndPath();

    public Timestamp getValidFrom() {
        return this.validFrom;
    }

    public void setValidFrom(Timestamp _validFrom) {
        this.validFrom = _validFrom;
    }

    public Timestamp getValidTo() {
        return this.validTo;
    }

    public void setValidTo(Timestamp _validTo) {
        this.validTo = _validTo;
    }

    public Integer getSource() {
        return source;
    }

    public void setSource(Integer source) {
        this.source = source;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }
}