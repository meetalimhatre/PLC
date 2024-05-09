package com.sap.plc.backend.error;

public enum ErrorCode {

    //############### GENERAL ERRORS ###############
    CREATE_FAILURE("GENERAL_CREATION_ERROR", "Creation failure"),
    UPDATE_FAILURE("GENERAL_UPDATE_ERROR", "Update failure"),
    PATCH_FAILURE("GENERAL_PATCH_ERROR", "Patch failure"),
    DELETE_FAILURE("GENERAL_DELETE_ERROR", "Delete failure"),

    //############## ERR DETAILS CODES ##############
    GENERAL_UNEXPECTED_ERROR("GENERAL_UNEXPECTED_EXCEPTION", "Unexpected exception"),
    GENERAL_VALIDATION_ERROR("GENERAL_VALIDATION_ERROR", "General validation error"),
    SERVICE_UNAVAILABLE_ERROR("SERVICE_UNAVAILABLE_ERROR", "System unavailable error"),
    GENERAL_DEPENDENCY_VIOLATION_ERROR("GENERAL_DEPENDENCY_VIOLATION_ERROR", "General dependency violation error"),
    GENERAL_DATABASE_CHANGE_ERROR("GENERAL_DATABASE_CHANGE_ERROR", "Object maintenance failure"),
    GENERAL_ENTITY_DUPLICATE_ERROR("GENERAL_ENTITY_DUPLICATE_ERROR", "Entity already exists"),
    GENERAL_ENTITY_NOT_FOUND_ERROR("GENERAL_ENTITY_NOT_FOUND_ERROR", "Entity not found"),
    GENERAL_OPTIMISTIC_LOCK_ERROR("GENERAL_ENTITY_NOT_CURRENT_ERROR",
            "Entity modified in the meantime. Please get the latest version before trying to update the entity"),
    GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR("GENERAL_TARGET_ENTITY_NOT_FOUND_ERROR", "Entity not found"),
    GENERAL_TARGET_OPTIMISTIC_LOCK_ERROR("GENERAL_TARGET_ENTITY_NOT_CURRENT_ERROR",
            "Entity modified in the meantime. Please get the latest version before trying to update the entity"),
    GENERAL_ACCESS_DENIED("GENERAL_ACCESS_DENIED", "Access denied"),
    FOLDER_NAME_NOT_UNIQUE_ERROR("FOLDER_NAME_NOT_UNIQUE_ERROR", "Folder name not unique"),
    GENERAL_ENTITY_INVALIDATED_ERROR("GENERAL_ENTITY_INVALIDATED_ERROR", "Entity was deleted by another user"),
    GENERAL_NOT_EMPTY_ERROR("GENERAL_NOT_EMPTY_ERROR", "Entity is not empty"),
    FOLDER_DEPTH_ERROR("FOLDER_DEPTH_ERROR", "Depth is not valid"),
    STATUS_NOT_ACTIVE_ERROR("STATUS_NOT_ACTIVE_ERROR", "Status is not active"),
    GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR("GENERAL_ENTITY_CANNOT_BE_DELETED_ERROR", "Entity still has dependencies"),
    PROJECT_NOT_WRITABLE_ERROR("PROJECT_NOT_WRITABLE_ERROR", "Project not writeable"),
    GENERAL_ENTITY_ALREADY_EXISTS_ERROR("GENERAL_ENTITY_ALREADY_EXISTS_ERROR", "Entity already exists"),
    COPY_ENTITY_PROPERTIES_FAILURE("PLC-012"),
    FOREIGN_KEY_INVALID("PLC-018"),
    DUPLICATED_DISPLAY_ORDER_ERROR("DUPLICATED_DISPLAY_ORDER_ERROR", "Status entity has a duplicated display order"),
    ITEM_CATEGORY_LIMIT_REACHED_ERROR("ITEM_CATEGORY_LIMIT_REACHED_ERROR", "The maximum number of custom item " +
            "categories has been reached"),
    CUSTOM_ITEM_CATEGORY_ID_IN_USE_ERROR("CUSTOM_ITEM_CATEGORY_ID_IN_USE_ERROR", "The custom item " +
            "category can't be deleted because it's already in use.");

    private String code;
    private String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    ErrorCode(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
