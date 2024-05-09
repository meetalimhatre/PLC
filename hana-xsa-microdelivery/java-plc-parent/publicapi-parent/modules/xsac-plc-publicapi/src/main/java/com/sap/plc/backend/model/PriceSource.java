package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.PriceSourcePKAndTimestamp;
import com.sap.plc.backend.model.pks.PriceSourcePrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.hibernate.annotations.ColumnDefault;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.sql.Timestamp;
import java.util.LinkedList;
import java.util.List;

import static com.sap.plc.backend.model.PriceSource.TABLE_NAME;

@IdClass(PriceSourcePrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class PriceSource extends com.sap.plc.backend.model.Entity<PriceSource, PriceSourcePrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_price_source`";
    private static final long serialVersionUID = -1342454323364240122L;
    private static final Integer DEFAULT_CONFIDENCE_LEVEL_ID = 3;

    @Id
    @Column(name = "PRICE_SOURCE_ID")
    @Size(max = 20)
    @NotNull
    @Pattern(regexp = ".*^[\\p{L}\\d_:#.\\/\\-\\|](?:[\\p{L}\\d_:#.\\/\\-\\| ]*[\\p{L}\\d_:#.\\/\\-\\|])?$")
    private String priceSourceId;

    @Id
    @Column(name = "PRICE_SOURCE_TYPE_ID", nullable = false)
    @ColumnDefault(value = "1")
    private Integer priceSourceTypeId;

    @Column(name = "CONFIDENCE_LEVEL_ID")
    private Integer confidenceLevelId;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;

    @Transient
    private List<PriceSourceText> texts;

    public PriceSource() {
        texts = new LinkedList<>();
    }

    @PrePersist
    public void setDefaults() {
        if (confidenceLevelId == null) {
            confidenceLevelId = DEFAULT_CONFIDENCE_LEVEL_ID;
        }
    }

    public String getPriceSourceId() {
        return priceSourceId;
    }

    public void setPriceSourceId(String priceSourceId) {
        this.priceSourceId = priceSourceId;
    }

    public Integer getPriceSourceTypeId() {
        return priceSourceTypeId;
    }

    public void setPriceSourceTypeId(Integer priceSourceTypeId) {
        this.priceSourceTypeId = priceSourceTypeId;
    }

    public Integer getConfidenceLevelId() {
        return confidenceLevelId;
    }

    public void setConfidenceLevelId(Integer confidenceLevelId) {
        this.confidenceLevelId = confidenceLevelId;
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

    public Timestamp getLastModifiedOn() {
        return lastModifiedOn;
    }

    public void setLastModifiedOn(Timestamp lastModifiedOn) {
        this.lastModifiedOn = lastModifiedOn;
    }

    public String getLastModifiedBy() {
        return lastModifiedBy;
    }

    public void setLastModifiedBy(String lastModifiedBy) {
        this.lastModifiedBy = lastModifiedBy;
    }

    public List<PriceSourceText> getTexts() {
        return texts;
    }

    public void setTexts(List<PriceSourceText> texts) {
        this.texts = texts;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        PriceSource that = (PriceSource) o;

        return new EqualsBuilder()
                .append(priceSourceId, that.priceSourceId)
                .append(priceSourceTypeId, that.priceSourceTypeId)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(priceSourceId)
                .append(priceSourceTypeId)
                .toHashCode();
    }

    public PriceSourcePKAndTimestamp getEntityKeyAndTimestamp() {
        return new PriceSourcePKAndTimestamp(this.getPriceSourceId(), this.priceSourceTypeId, this.lastModifiedOn);
    }
}
