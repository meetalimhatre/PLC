package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.CustomerGeneratedDto;
import com.sap.plc.backend.model.masterdata.Customer;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class CustomerMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CustomerGeneratedDtoMapper extends MasterdataMapper<Customer, CustomerGeneratedDto> {
    }
}