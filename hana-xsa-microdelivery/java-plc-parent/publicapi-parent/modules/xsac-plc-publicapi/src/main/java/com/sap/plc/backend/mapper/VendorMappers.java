package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.VendorGeneratedDto;
import com.sap.plc.backend.model.masterdata.Vendor;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class VendorMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface VendorGeneratedDtoMapper extends MasterdataMapper<Vendor, VendorGeneratedDto> {
    }
}
