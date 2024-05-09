package com.sap.plc.backend.controller;

import com.sap.plc.backend.api.PublicAPI;
import com.sap.plc.backend.dto.FolderCreateGeneratedDto;
import com.sap.plc.backend.dto.FolderDeleteGeneratedDto;
import com.sap.plc.backend.dto.FolderMoveGeneratedDto;
import com.sap.plc.backend.dto.FolderRenameGeneratedDto;
import com.sap.plc.backend.dto.apiResponse.PlcResponse;
import com.sap.plc.backend.mapper.FolderMappers;
import com.sap.plc.backend.service.FolderService;
import com.sap.plc.backend.util.OffsetPageable;
import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

import static com.sap.plc.backend.api.ReturnType.FULL;
import static com.sap.plc.backend.constants.GeneralConstants.RETURN_TYPE;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createDeleteResult;
import static com.sap.plc.backend.controller.utils.ResponseUtils.createResult;

@RestController
@Scope(proxyMode = ScopedProxyMode.TARGET_CLASS)
@RequestMapping(path = FolderController.PATH, produces = MediaType.APPLICATION_JSON_VALUE)
@Validated
public class FolderController implements FolderGeneratedController {

    public static final String PATH = PublicAPI.API_BASE + "/" + PublicAPI.FOLDERS;
    static final String MOVE_PATH = PublicAPI.API_BASE + "/" + PublicAPI.FOLDERS + "/move";

    @Resource
    private FolderService folderService;

    @Resource
    private FolderMappers.FolderGeneratedDtoMapper folderGeneratedDtoMapper;

    @Override
    @PostMapping
    public ResponseEntity create(@NotNull @RequestBody FolderCreateGeneratedDto body,
                                 @Valid @Pattern(regexp = "^(ids|full)$")
                                 @RequestParam(value = RETURN_TYPE, required = false, defaultValue = "ids")
                                         String returnType) {

        return createResult(folderService.create(body), null, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.CREATED, "folderId");
    }

    @Override
    @DeleteMapping
    public ResponseEntity delete(@NotEmpty @RequestBody List<FolderDeleteGeneratedDto> body) {
        return createDeleteResult(folderService.delete(body), PATH, HttpStatus.OK);

    }

    @Override
    @GetMapping
    public ResponseEntity<PlcResponse> getFolders(
            @Valid @Min(1) @Max(10000) @RequestParam(value = "top", required = false, defaultValue = "100") Integer top,
            @Valid @Min(0) @RequestParam(value = "skip", required = false, defaultValue = "0") Integer skip,
            @Valid @Size(max = 500) @RequestParam(value = "filter", required = false) String filter,
            @Valid @Size(max = 500) @RequestParam(value = "fields", required = false) String fields) {

        Pageable pageable = new OffsetPageable(skip, top, Sort.by("folderId").ascending());

        PlcResponse response = new PlcResponse();
        response.setEntities(folderService.search(filter, fields, pageable));

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @Override
    @PatchMapping(value = "/move")
    public ResponseEntity move(@NotEmpty @RequestBody List<FolderMoveGeneratedDto> body,
                               @Valid @Pattern(regexp = "^(ids|full)$")
                               @RequestParam(value = RETURN_TYPE, required = false, defaultValue = "ids")
                                       String returnType) {

        return createResult(folderService.move(body), folderGeneratedDtoMapper, MOVE_PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, "folderId");
    }

    @Override
    @PatchMapping
    public ResponseEntity rename(@NotEmpty @RequestBody List<FolderRenameGeneratedDto> body,
                                 @Valid @Pattern(regexp = "^(ids|full)$")
                                 @RequestParam(value = RETURN_TYPE, required = false, defaultValue = "ids")
                                         String returnType) {

        return createResult(folderService.rename(body), folderGeneratedDtoMapper, PATH,
                FULL.getReturnType().equalsIgnoreCase(returnType), HttpStatus.OK, "folderId");
    }
}