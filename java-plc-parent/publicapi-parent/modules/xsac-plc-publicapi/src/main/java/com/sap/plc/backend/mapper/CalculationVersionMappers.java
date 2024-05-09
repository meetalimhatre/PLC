package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.CalculationVersionGeneratedDto;
import com.sap.plc.backend.model.CalculationVersion;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class CalculationVersionMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CalculationVersionGeneratedDtoMapper extends EntityMapper<CalculationVersion,
            CalculationVersionGeneratedDto> {
    }
}
