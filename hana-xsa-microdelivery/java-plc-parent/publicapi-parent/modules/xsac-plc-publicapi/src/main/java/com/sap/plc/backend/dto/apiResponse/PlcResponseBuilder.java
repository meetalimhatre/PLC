package com.sap.plc.backend.dto.apiResponse;

import com.sap.plc.backend.error.ErrorCode;
import com.sap.plc.backend.model.Entity;
import com.sap.plc.backend.model.PrimaryKey;
import org.springframework.util.CollectionUtils;

import java.util.List;

public class PlcResponseBuilder<TEntity extends Entity, TEntityId extends PrimaryKey> {
    protected SuccessResponse<TEntity> successResponse;
    protected ErrorResponse<TEntityId> errorResponse;

    public PlcResponseBuilder() {
    }

    public PlcResponseBuilder setSuccessEntities(List<TEntity> successEntities) {
        if(!CollectionUtils.isEmpty(successEntities)) {
            successResponse = new SuccessResponse<>();
            successResponse.setEntities(successEntities);
        }
        return this;
    }


    public PlcResponseBuilder<TEntity, TEntityId> setCreateErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.errorResponse = getErrorResponse(ErrorCode.CREATE_FAILURE, errorDetails);
        return this;
    }

    public PlcResponseBuilder<TEntity, TEntityId> setUpdateErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.errorResponse = getErrorResponse(ErrorCode.UPDATE_FAILURE, errorDetails);
        return this;
    }

    public PlcResponseBuilder<TEntity, TEntityId> setPatchErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.errorResponse = getErrorResponse(ErrorCode.PATCH_FAILURE, errorDetails);
        return this;
    }

    public PlcResponseBuilder<TEntity, TEntityId> setDeleteErrorDetails(List<ErrorResponseDetail<TEntityId>> errorDetails) {
        this.errorResponse = getErrorResponse(ErrorCode.DELETE_FAILURE, errorDetails);
        return this;
    }

    private ErrorResponse<TEntityId> getErrorResponse(ErrorCode genErrorCode,
                                                      List<ErrorResponseDetail<TEntityId>> errorDetails) {
        if (CollectionUtils.isEmpty(errorDetails)) {
            return null;
        }
        return new ErrorResponse<>(genErrorCode.getCode(), genErrorCode.getMessage(), "", null, errorDetails);
    }

    public PlcResponse<TEntity, TEntityId> build() {
        return new PlcResponse<>(this.successResponse, this.errorResponse);
    }

}
