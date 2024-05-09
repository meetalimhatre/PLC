package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.LifecycleQuantityGeneratedDto;
import com.sap.plc.backend.dto.LifecycleQuantityWithAuditFieldsGeneratedDto;
import com.sap.plc.backend.dto.LifecycleQuantityKeyGeneratedDto;
import com.sap.plc.backend.model.LifecycleQuantity;
import com.sap.plc.backend.model.pks.LifecycleQuantityPrimaryKey;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class LifecycleQuantityMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface LifecycleQuantityGeneratedDtoMapper
            extends EntityMapper<LifecycleQuantity, LifecycleQuantityGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface LifecycleQuantityKeyGeneratedDtoMapper
            extends PrimaryKeyMapper<LifecycleQuantityPrimaryKey, LifecycleQuantityKeyGeneratedDto> {
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface LifecycleQuantityWithAuditFieldsGeneratedDtoMapper
            extends EntityMapper<LifecycleQuantity, LifecycleQuantityWithAuditFieldsGeneratedDto> {
    }
}