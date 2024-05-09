package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.MaterialGeneratedDto;
import com.sap.plc.backend.model.masterdata.Material;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class MaterialMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface MaterialGeneratedDtoMapper extends MasterdataMapper<Material,
            MaterialGeneratedDto> {
    }

}
