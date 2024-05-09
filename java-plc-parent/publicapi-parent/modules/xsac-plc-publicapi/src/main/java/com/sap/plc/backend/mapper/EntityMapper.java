package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.Dto;
import com.sap.plc.backend.model.Entity;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

public interface EntityMapper<TEntity extends Entity, TDto extends Dto>{

    TDto entityToDto(TEntity tEntity);

    TEntity dtoToEntity(TDto tDto);

    List<TDto> entityToDto(List<TEntity> tEntityCollection);

    List<TEntity> dtoToEntity(List<TDto> tDtoCollection);

    default Timestamp map(@NotBlank @Valid Instant value) {
        return value != null ? Timestamp.from(value) : null;
    }

    default Instant map(@NotBlank @Valid Timestamp value) {
        return value !=null ? value.toInstant() : null;
    }
    
}
