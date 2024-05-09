package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.ItemCategoryTextPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import static com.sap.plc.backend.model.ItemCategoryText.TABLE_NAME;

@IdClass(ItemCategoryTextPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class ItemCategoryText extends com.sap.plc.backend.model.Entity<ItemCategoryText, ItemCategoryTextPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_item_category__text`";
    private static final long serialVersionUID = -9047252817661395030L;

    public ItemCategoryText() {
    }

    public ItemCategoryText(Integer itemCategoryId, Integer childItemCategoryId, String language,
                            String itemCategoryName, String description) {
        this.itemCategoryId = itemCategoryId;
        this.childItemCategoryId = childItemCategoryId;
        this.language = language;
        this.itemCategoryName = itemCategoryName;
        this.description = description;
    }

    @Id
    @Column(name = "ITEM_CATEGORY_ID")
    @NotNull
    private Integer itemCategoryId;

    @Id
    @Column(name = "CHILD_ITEM_CATEGORY_ID")
    @NotNull
    private Integer childItemCategoryId;

    @Id
    @Column(name = "LANGUAGE")
    @NotNull
    private String language;

    @Column(name = "ITEM_CATEGORY_NAME")
    private String itemCategoryName;

    @Column(name = "ITEM_CATEGORY_DESCRIPTION")
    private String description;

    public Integer getItemCategoryId() {
        return itemCategoryId;
    }

    public void setItemCategoryId(Integer itemCategoryId) {
        this.itemCategoryId = itemCategoryId;
    }

    public Integer getChildItemCategoryId() {
        return childItemCategoryId;
    }

    public void setChildItemCategoryId(Integer childItemCategoryId) {
        this.childItemCategoryId = childItemCategoryId;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getItemCategoryName() {
        return itemCategoryName;
    }

    public void setItemCategoryName(String itemCategoryName) {
        this.itemCategoryName = itemCategoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    @Override
    public ItemCategoryTextPrimaryKey getEntityKey() {
        return new ItemCategoryTextPrimaryKey(this.itemCategoryId, this.childItemCategoryId, this.language);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ItemCategoryText that = (ItemCategoryText) o;

        return new EqualsBuilder()
                .append(getItemCategoryId(), that.getItemCategoryId())
                .append(getChildItemCategoryId(), that.getChildItemCategoryId())
                .append(getLanguage(), that.getLanguage())
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getItemCategoryId())
                .append(getChildItemCategoryId())
                .append(getLanguage())
                .toHashCode();
    }
}
