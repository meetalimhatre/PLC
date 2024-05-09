package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.ControllingAreaGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.masterdata.ControllingArea;
import com.sap.plc.backend.model.masterdata.ControllingAreaText;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class ControllingAreaMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ControllingAreaGeneratedDtoMapper
            extends MasterdataMapper<ControllingArea, ControllingAreaGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface ControllingAreaTextGeneratedDtoMapper extends EntityMapper<ControllingAreaText,
            TextsGeneratedDto> {
    }
}
