package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.UomPrimaryKey;
import com.sap.plc.backend.repository.annotation.Fk;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.math.BigDecimal;
import java.util.Map;

@IdClass(UomPrimaryKey.class)
@Entity
@Table(name = Uom.TABLE_NAME)
public class Uom extends Masterdata<Uom, UomPrimaryKey> {

    public static final String TABLE_NAME = "`sap.plc.db::basis.t_uom`";
    private static final long serialVersionUID = 4887961449882386703L;
    @Id
    @Column(name = "UOM_ID", nullable = false, length = 3)
    private String uomId;

    @Column(name = "DIMENSION_ID", nullable = false, length = 10)
    @Fk(Dimension.class)
    private String dimensionId;

    @Column(name = "NUMERATOR", nullable = false)
    private Integer numerator;

    @Column(name = "DENOMINATOR", nullable = false)
    private Integer denominator;

    @Column(name = "EXPONENT_BASE10", nullable = false)
    private Integer exponentBase10;

    @Column(name = "SI_CONSTANT", nullable = false)
    private BigDecimal siConstant;

    @Transient
    private Map textsMap;

    public String getUomId() {
        return uomId;
    }

    public void setUomId(String uomId) {
        this.uomId = uomId;
    }

    public String getDimensionId() {
        return dimensionId;
    }

    public void setDimensionId(String dimensionId) {
        this.dimensionId = dimensionId;
    }

    public Integer getNumerator() {
        return numerator;
    }

    public void setNumerator(Integer numerator) {
        this.numerator = numerator;
    }

    public Integer getDenominator() {
        return denominator;
    }

    public void setDenominator(Integer denominator) {
        this.denominator = denominator;
    }

    public Integer getExponentBase10() {
        return exponentBase10;
    }

    public void setExponentBase10(Integer exponentBase10) {
        this.exponentBase10 = exponentBase10;
    }

    public BigDecimal getSiConstant() {
        return siConstant;
    }

    public void setSiConstant(BigDecimal siConstant) {
        this.siConstant = siConstant;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(uomId)
                .append(validFrom)
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

        Uom uom = (Uom) o;

        return new EqualsBuilder()
                .append(uomId, uom.uomId)
                .append(validFrom, uom.validFrom)
                .isEquals();
    }

    @Override
    public String getEntityId() {
        return uomId.replace("#", "%23");
    }

    @Override
    public String getUniqueQuery() {
        return "validFrom=" + this.validFrom;
    }

    @Override
    public Map getTextsMap() {
        return this.textsMap;
    }

    public void setTextsMap(Map textsMap) {
        this.textsMap = textsMap;
    }

    @Override
    public boolean idEquals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        Uom uom = (Uom) o;

        return new EqualsBuilder()
                .append(uomId, uom.uomId)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return "Unit_Of_Measure";
    }
}