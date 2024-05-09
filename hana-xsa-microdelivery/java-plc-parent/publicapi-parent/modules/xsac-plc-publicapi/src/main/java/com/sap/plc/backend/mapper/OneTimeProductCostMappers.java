package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.OneTimeProductCostCreateGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostDeleteGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostPatchGeneratedDto;
import com.sap.plc.backend.dto.OneTimeProductCostPutGeneratedDto;
import com.sap.plc.backend.model.OneTimeProductCost;
import com.sap.plc.backend.model.pks.OneTimeProductCostPrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class OneTimeProductCostMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProductCostGeneratedDtoMapper extends EntityMapper<OneTimeProductCost,
            OneTimeProductCostGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProductCostDeleteGeneratedDtoMapper extends PrimaryKeyMapper<OneTimeProductCostPrimaryKey,
            OneTimeProductCostDeleteGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProductCostCreateGeneratedDtoMapper extends EntityMapper<OneTimeProductCost,
            OneTimeProductCostCreateGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProductCostPutGeneratedDtoMapper extends EntityMapper<OneTimeProductCost,
            OneTimeProductCostPutGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface OneTimeProductCostPatchGeneratedDtoMapper extends EntityMapper<OneTimeProductCost,
            OneTimeProductCostPatchGeneratedDto> {
    }
}
