package com.sap.plc.backend.dto.apiResponse.custom;

import com.sap.plc.backend.dto.apiResponse.PlcResponseBuilder;
import com.sap.plc.backend.dto.apiResponse.SuccessResponse;
import com.sap.plc.backend.model.Folder;

import java.util.List;

public class FolderCustomResponseBuilder extends PlcResponseBuilder {

    @Override
    public PlcResponseBuilder setSuccessEntities(List successEntities) {
        if (successEntities != null && !successEntities.isEmpty()) {
            this.successResponse = new SuccessResponse<Folder>();
            this.successResponse.setEntities(successEntities);
        }

        return this;
    }
}
