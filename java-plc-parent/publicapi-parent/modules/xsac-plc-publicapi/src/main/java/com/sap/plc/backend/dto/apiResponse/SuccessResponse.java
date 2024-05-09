package com.sap.plc.backend.dto.apiResponse;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.apache.commons.lang3.builder.EqualsBuilder;
import org.apache.commons.lang3.builder.HashCodeBuilder;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class SuccessResponse<T> implements Serializable {

    private static final long serialVersionUID = -1885745453252749889L;

    private List<T> entities;

    public SuccessResponse() {
    }

    public List<T> getEntities() {
        return entities;
    }

    public void setEntities(List<T> entities) {
        this.entities = entities;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }

        if (o == null || getClass() != o.getClass()) {
            return false;
        }

        SuccessResponse that = (SuccessResponse) o;

        return new EqualsBuilder()
                .append(entities, that.entities)
                .isEquals();
    }

    @Override
    public int hashCode() {
        return new HashCodeBuilder(17, 37)
                .append(entities)
                .toHashCode();
    }
}
