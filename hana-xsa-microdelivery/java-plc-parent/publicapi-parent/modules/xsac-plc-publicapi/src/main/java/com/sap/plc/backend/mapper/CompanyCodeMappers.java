package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.CompanyCodeGeneratedDto;
import com.sap.plc.backend.dto.TextsGeneratedDto;
import com.sap.plc.backend.model.masterdata.CompanyCode;
import com.sap.plc.backend.model.masterdata.CompanyCodeText;
import org.mapstruct.Mapper;
import org.mapstruct.NullValueMappingStrategy;

public class CompanyCodeMappers {

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CompanyCodeGeneratedDtoMapper extends MasterdataMapper<CompanyCode, CompanyCodeGeneratedDto>{
    }

    @Mapper(nullValueMappingStrategy = NullValueMappingStrategy.RETURN_DEFAULT)
    public interface CompanyCodeTextGeneratedDtoMapper extends EntityMapper<CompanyCodeText, TextsGeneratedDto>{
    }
}
