package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.PlantGeneratedDto;
import com.sap.plc.backend.model.masterdata.Plant;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class PlantMappers {
    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface PlantGeneratedDtoMapper extends MasterdataMapper<Plant,
            PlantGeneratedDto> {
    }
}
