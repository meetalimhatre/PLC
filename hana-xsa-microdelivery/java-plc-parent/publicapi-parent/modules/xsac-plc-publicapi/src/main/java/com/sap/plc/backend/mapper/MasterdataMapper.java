package com.sap.plc.backend.mapper;

import com.sap.plc.backend.dto.Dto;
import com.sap.plc.backend.model.masterdata.Masterdata;

public interface MasterdataMapper<TEntity extends Masterdata, TDto extends Dto> 
		extends EntityMapper<TEntity, TDto> {
}
