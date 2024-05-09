package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.DimensionPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import java.util.Map;

import static com.sap.plc.backend.model.masterdata.Dimension.TABLE_NAME;

@IdClass(DimensionPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class Dimension extends Masterdata<Dimension, DimensionPrimaryKey> {

    private static final long serialVersionUID = 6652919431628267051L;
    static final String TABLE_NAME = "`sap.plc.db::basis.t_dimension`";
    private static final String METADATA_BUSINESS_OBJECT_AND_PATH = "Dimension";


    @Id
    @Column(name = "DIMENSION_ID", nullable = false, length = 4)
    private String dimensionId;

    public String getDimensionId() {
        return dimensionId;
    }

    public void setDimensionId(String dimensionId) {
        this.dimensionId = dimensionId;
    }

    @Override
    public String getEntityId() {
        return this.dimensionId;
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public Map getTextsMap() {
        return null;
    }

    @Override
    public void setTextsMap(Map<String, Object> textsMap) {

    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Dimension that = (Dimension) o;

        return new EqualsBuilder()
                .append(dimensionId, that.dimensionId)
                .append(validFrom, that.validFrom)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(dimensionId)
                .append(validFrom)
                .toHashCode();
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Dimension that = (Dimension) o;

        return new EqualsBuilder()
                .append(dimensionId, that.dimensionId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return METADATA_BUSINESS_OBJECT_AND_PATH;
    }
}
