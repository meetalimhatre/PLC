package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.LifecyclePeriodGeneratedDto;
import com.sap.plc.backend.dto.LifecyclePeriodWithAuditFieldsGeneratedDto;
import com.sap.plc.backend.model.LifecyclePeriod;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class LifecyclePeriodsMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface LifecyclePeriodsGeneratedDtoMapper extends EntityMapper<LifecyclePeriod,
            LifecyclePeriodGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface LifecyclePeriodsWithAuditGeneratedDtoMapper extends EntityMapper<LifecyclePeriod,
            LifecyclePeriodWithAuditFieldsGeneratedDto> {
    }
}
