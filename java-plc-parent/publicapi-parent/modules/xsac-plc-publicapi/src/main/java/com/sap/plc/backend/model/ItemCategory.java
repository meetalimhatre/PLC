package com.sap.plc.backend.model;

import com.sap.plc.backend.model.pks.ItemCategoryPrimaryKey;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import java.sql.Timestamp;
import java.util.List;

import static com.sap.plc.backend.model.ItemCategory.TABLE_NAME;

@IdClass(ItemCategoryPrimaryKey.class)
@Entity
@Table(name = TABLE_NAME)
public class ItemCategory extends com.sap.plc.backend.model.Entity<ItemCategory, ItemCategoryPrimaryKey> {

    static final String TABLE_NAME = "`sap.plc.db::basis.t_item_category`";

    private static final long serialVersionUID = -3963403846769784231L;

    @Id
    @Column(name = "ITEM_CATEGORY_ID")
    @NotNull
    private Integer itemCategoryId;

    @Id
    @Column(name = "CHILD_ITEM_CATEGORY_ID")
    @NotNull
    private Integer childItemCategoryId;

    @Column(name = "ICON")
    @NotNull
    private String icon;

    @Column(name = "DISPLAY_ORDER")
    private Integer displayOrder;

    @Column(name = "CREATED_ON")
    private Timestamp createdOn;

    @Column(name = "CREATED_BY")
    private String createdBy;

    @Column(name = "LAST_MODIFIED_ON")
    private Timestamp lastModifiedOn;

    @Column(name = "LAST_MODIFIED_BY")
    private String lastModifiedBy;

    @Column(name = "ITEM_CATEGORY_CODE")
    @NotNull
    private String itemCategoryCode;

    @Transient
    private List<ItemCategoryText> texts;

    public ItemCategory() {
    }

    public ItemCategory(Integer itemCategoryId, Integer childItemCategoryId) {
        this.itemCategoryId = itemCategoryId;
        this.childItemCategoryId = childItemCategoryId;
    }

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

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
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

    public String getItemCategoryCode() {
        return itemCategoryCode;
    }

    public void setItemCategoryCode(String itemCategoryCode) {
        this.itemCategoryCode = itemCategoryCode;
    }

    public List<ItemCategoryText> getTexts() {
        return texts;
    }

    public void setTexts(List<ItemCategoryText> texts) {
        this.texts = texts;
    }

    @Override
    public ItemCategoryPrimaryKey getEntityKey() {
        return new ItemCategoryPrimaryKey(this.itemCategoryId, this.childItemCategoryId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        ItemCategory that = (ItemCategory) o;

        return new EqualsBuilder()
                .append(getItemCategoryId(), that.getItemCategoryId())
                .append(getChildItemCategoryId(), that.getChildItemCategoryId())
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(getItemCategoryId())
                .append(getChildItemCategoryId())
                .toHashCode();
    }

    @Override
    public String getTextTableName() {
        return ItemCategoryText.TABLE_NAME;
    }

}
