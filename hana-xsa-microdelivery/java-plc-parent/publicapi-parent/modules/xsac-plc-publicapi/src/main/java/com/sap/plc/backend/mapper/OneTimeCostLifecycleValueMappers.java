package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.OneTimeCostLifecycleValueDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeCostLifecycleValueGeneratedDto;
import com.sap.plc.backend.model.OneTimeCostLifecycleValue;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class OneTimeCostLifecycleValueMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeCostLifecycleValueGeneratedDtoMapper extends EntityMapper<OneTimeCostLifecycleValue,
            OneTimeCostLifecycleValueGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeCostLifecycleValueDeleteGeneratedDtoMapper extends EntityMapper<OneTimeCostLifecycleValue,
            OneTimeCostLifecycleValueDeleteGeneratedDto> {
    }
}
