package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.Dto;
import com.sap.plc.backend.model.PrimaryKey;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

public interface PrimaryKeyMapper<TEntityPK extends PrimaryKey, TDto extends Dto> {

    TDto pkToDto(TEntityPK tEntityId);

    TEntityPK dtoToPK(TDto tDto);

    List<TDto> pkToDto(List<TEntityPK> tEntityIdCollection);

    List<TEntityPK> dtoToPK(List<TDto> tDtoCollection);

    default Timestamp map(@NotBlank @Valid Instant value) {
        return value != null ? Timestamp.from(value) : null;
    }

    default Instant map(@NotBlank @Valid Timestamp value) {
        return value != null ? value.toInstant() : null;
    }

}