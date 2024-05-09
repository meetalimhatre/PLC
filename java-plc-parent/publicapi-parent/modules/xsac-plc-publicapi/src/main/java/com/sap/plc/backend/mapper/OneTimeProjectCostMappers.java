package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.OneTimeProjectCostCreateGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostPatchGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProjectCostPutGeneratedDto;
import com.sap.plc.backend.model.OneTimeProjectCost;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class OneTimeProjectCostMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProjectCostGeneratedDtoMapper extends EntityMapper<OneTimeProjectCost,
            OneTimeProjectCostGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProjectCostPatchGeneratedDtoMapper extends EntityMapper<OneTimeProjectCost,
            OneTimeProjectCostPatchGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProjectCostCreateGeneratedDtoMapper extends EntityMapper<OneTimeProjectCost,
            OneTimeProjectCostCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProjectCostPutGeneratedDtoMapper extends EntityMapper<OneTimeProjectCost,
            OneTimeProjectCostPutGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProjectCostDeleteGeneratedDtoMapper extends EntityMapper<OneTimeProjectCost,
            OneTimeProjectCostDeleteGeneratedDto> {
    }
}
