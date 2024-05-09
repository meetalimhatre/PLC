package com.sap.plc.backend.model;

import com.sap.plc.backend.util.PlcSimpleToStringStyle;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import static com.sap.plc.backend.model.EntityRelationView.TABLE_NAME;

@Entity
@Immutable
@Table(name = TABLE_NAME)
public class EntityRelationView {

    public static final String TABLE_NAME_NO_QUOTES = "sap.plc.db.views::v_entity_relation";

    public static final String TABLE_NAME = "`" + TABLE_NAME_NO_QUOTES + "`";

    @Column(name = "QUERY_NODE", nullable = false, length = 5000, updatable = false, insertable = false)
    private Integer queryNode;

    @Id
    @Column(name = "RESULT_NODE", nullable = false, length = 5000, updatable = false, insertable = false)
    private Integer resultNode;

    @Column(name = "PRED_NODE", nullable = false, length = 5000, updatable = false, insertable = false)
    private Integer predNode;

    @Column(name = "LEVEL", nullable = false, updatable = false, insertable = false)
    private Integer level;

    @Column(name = "LEVEL_NAME", nullable = false, length = 5000, updatable = false, insertable = false)
    private String levelName;

    @Column(name = "ORDINAL", nullable = false, updatable = false, insertable = false)
    private Integer ordinal;

    @Column(name = "DISTANCE", nullable = false, updatable = false, insertable = false)
    private Integer distance;

    @Column(name = "IS_LEAF", nullable = false, updatable = false, insertable = false)
    private Integer isLeaf;

    @Column(name = "IS_CYCLE", nullable = false, updatable = false, insertable = false)
    private Integer isCycle;

    @Column(name = "PATH", nullable = false, length = 5000, updatable = false, insertable = false)
    private String path;

    @Column(name = "PARENTS", length = 5000, updatable = false, insertable = false)
    private String parents;

    @Column(name = "CHILDREN", length = 5000, updatable = false, insertable = false)
    private String children;

    @Column(name = "ENTITY_TYPE", nullable = false, length = 1, updatable = false, insertable = false)
    private String entityType;

    @Column(name = "PARENT_ENTITY_TYPE", length = 1, updatable = false, insertable = false)
    private String parentType;

    public EntityRelationView() {
    }

    public EntityRelationView(Integer resultNode) {
        this.resultNode = resultNode;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public Integer getQueryNode() {
        return queryNode;
    }

    public void setQueryNode(Integer queryNode) {
        this.queryNode = queryNode;
    }

    public Integer getResultNode() {
        return resultNode;
    }

    public void setResultNode(Integer resultNode) {
        this.resultNode = resultNode;
    }

    public Integer getPredNode() {
        return predNode;
    }

    public void setPredNode(Integer predNode) {
        this.predNode = predNode;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }

    public String getLevelName() {
        return levelName;
    }

    public void setLevelName(String levelName) {
        this.levelName = levelName;
    }

    public Integer getOrdinal() {
        return ordinal;
    }

    public void setOrdinal(Integer ordinal) {
        this.ordinal = ordinal;
    }

    public Integer getDistance() {
        return distance;
    }

    public void setDistance(Integer distance) {
        this.distance = distance;
    }

    public Integer getIsLeaf() {
        return isLeaf;
    }

    public void setIsLeaf(Integer isLeaf) {
        this.isLeaf = isLeaf;
    }

    public Integer getIsCycle() {
        return isCycle;
    }

    public void setIsCycle(Integer isCycle) {
        this.isCycle = isCycle;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getParents() {
        return parents;
    }

    public void setParents(String parents) {
        this.parents = parents;
    }

    public String getChildren() {
        return children;
    }

    public void setChildren(String children) {
        this.children = children;
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
                .append(resultNode)
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

        EntityRelationView that = (EntityRelationView) o;

        return new EqualsBuilder()
                .append(resultNode, that.resultNode)
                .isEquals();
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this, PlcSimpleToStringStyle.PLC_SIMPLE_STYLE)
                .append("queryNode", queryNode)
                .append("resultNode", resultNode)
                .append("predNode", predNode)
                .append("level", level)
                .append("levelName", levelName)
                .append("ordinal", ordinal)
                .append("distance", distance)
                .append("isLeaf", isLeaf)
                .append("isCycle", isCycle)
                .append("path", path)
                .append("parents", parents)
                .append("children", children)
                .append("entityType", entityType)
                .append("parentType", parentType)
                .toString();
    }
}
