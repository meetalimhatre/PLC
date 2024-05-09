package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.CostCenterGeneratedDto;
import com.sap.plc.backend.dto.CostCenterSearchGeneratedDto;
import com.sap.plc.backend.model.masterdata.CostCenter;
import com.sap.plc.backend.model.pks.CostCenterPrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class CostCenterMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CostCenterGeneratedDtoMapper extends MasterdataMapper<CostCenter,
            CostCenterGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CostCenterSearchGeneratedDtoMapper extends PrimaryKeyMapper<CostCenterPrimaryKey,
            CostCenterSearchGeneratedDto> {
    }

}
