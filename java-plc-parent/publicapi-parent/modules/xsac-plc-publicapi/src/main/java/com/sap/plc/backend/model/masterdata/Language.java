package com.sap.plc.backend.model.masterdata;

import com.sap.plc.backend.model.pks.LanguagePrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.util.Map;

@IdClass(LanguagePrimaryKey.class)
@Entity
@Table(name = Language.TABLE_NAME)
public class Language extends Masterdata<Language, LanguagePrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_language`";
    private static final long serialVersionUID = -1445988348804705486L;
    @Id
    @Column(name = "LANGUAGE", nullable = false, length = 11)
    private String language;

    @Column(name = "TEXTS_MAINTAINABLE")
    private Integer textsMaintainable;

    @Transient
    private Map textsMap;

    public Language(String language) {
        this.language = language;
    }

    public Language() {
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public Integer getTextsMaintainable() {
        return textsMaintainable;
    }

    public void setTextsMaintainable(Integer textsMaintainable) {
        this.textsMaintainable = textsMaintainable;
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(language)
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

        Language language1 = (Language) o;

        return new EqualsBuilder()
                .append(language, language1.language)
                .append(validFrom, language1.validFrom)
                .isEquals();
    }

    @Override
    public String getEntityId() {
        return language;
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

        Language language1 = (Language) o;

        return new EqualsBuilder()
                .append(language, language1.language)
                .isEquals();
    }

    @Override
    public String getMetadataBusinessObjectAndPath() {
        return this.getClass().getSimpleName();
    }

}