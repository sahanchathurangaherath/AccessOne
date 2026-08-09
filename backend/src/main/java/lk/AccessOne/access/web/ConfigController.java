package lk.AccessOne.access.web;

import jakarta.validation.Valid;
import lk.AccessOne.access.service.AccessLevelService;
import lk.AccessOne.access.service.AreaService;
import lk.AccessOne.access.web.dto.AccessLevelDto;
import lk.AccessOne.access.web.dto.AccessLevelInput;
import lk.AccessOne.access.web.dto.AccessTestRequest;
import lk.AccessOne.access.web.dto.AccessTestResult;
import lk.AccessOne.access.web.dto.AreaDto;
import lk.AccessOne.access.web.dto.AreaIdsRequest;
import lk.AccessOne.access.web.dto.AreaInput;
import lk.AccessOne.access.web.dto.AssignRequest;
import lk.AccessOne.access.web.dto.AssignmentDto;
import lk.AccessOne.access.web.dto.PermissionMatrix;
import lk.AccessOne.organisation.service.DepartmentService;
import lk.AccessOne.organisation.web.dto.DepartmentDto;
import lk.AccessOne.organisation.web.dto.DepartmentInput;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the services. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/config")
public class ConfigController {

    private final DepartmentService departmentService;
    private final AreaService areaService;
    private final AccessLevelService accessLevelService;

    public ConfigController(DepartmentService departmentService, AreaService areaService,
                             AccessLevelService accessLevelService) {
        this.departmentService = departmentService;
        this.areaService = areaService;
        this.accessLevelService = accessLevelService;
    }

    // ---------- departments ----------

    @GetMapping("/departments")
    public List<DepartmentDto> departments() { return departmentService.findAll(); }

    @PostMapping("/departments")
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentDto createDepartment(@RequestBody @Valid DepartmentInput body) {
        return departmentService.create(body);
    }

    @PutMapping("/departments/{id}")
    public DepartmentDto updateDepartment(@PathVariable Long id, @RequestBody @Valid DepartmentInput body) {
        return departmentService.update(id, body);
    }

    @PostMapping("/departments/{id}/deactivate")
    public DepartmentDto deactivateDepartment(@PathVariable Long id) {
        return departmentService.deactivate(id);
    }

    @PostMapping("/departments/{id}/reactivate")
    public DepartmentDto reactivateDepartment(@PathVariable Long id) {
        return departmentService.reactivate(id);
    }

    @DeleteMapping("/departments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDepartment(@PathVariable Long id) { departmentService.delete(id); }

    // ---------- areas ----------

    @GetMapping("/areas")
    public List<AreaDto> areas() { return areaService.findAll(); }

    @PostMapping("/areas")
    @ResponseStatus(HttpStatus.CREATED)
    public AreaDto createArea(@RequestBody @Valid AreaInput body) {
        return areaService.create(body);
    }

    @PutMapping("/areas/{id}")
    public AreaDto updateArea(@PathVariable Long id, @RequestBody @Valid AreaInput body) {
        return areaService.update(id, body);
    }

    @PostMapping("/areas/{id}/deactivate")
    public AreaDto deactivateArea(@PathVariable Long id) { return areaService.deactivate(id); }

    @PostMapping("/areas/{id}/reactivate")
    public AreaDto reactivateArea(@PathVariable Long id) { return areaService.reactivate(id); }

    @DeleteMapping("/areas/{id}")
    public void deleteArea(@PathVariable Long id) { areaService.delete(id); }

    // ---------- access levels ----------

    @GetMapping("/access-levels")
    public List<AccessLevelDto> levels() { return accessLevelService.findAll(); }

    @GetMapping("/access-levels/{id}")
    public AccessLevelDto level(@PathVariable Long id) { return accessLevelService.findById(id); }

    @PostMapping("/access-levels")
    @ResponseStatus(HttpStatus.CREATED)
    public AccessLevelDto createLevel(@RequestBody @Valid AccessLevelInput body) {
        return accessLevelService.create(body);
    }

    @PutMapping("/access-levels/{id}")
    public AccessLevelDto updateLevel(@PathVariable Long id, @RequestBody @Valid AccessLevelInput body) {
        return accessLevelService.update(id, body);
    }

    @PostMapping("/access-levels/{id}/deactivate")
    public AccessLevelDto deactivateLevel(@PathVariable Long id) { return accessLevelService.deactivate(id); }

    @PostMapping("/access-levels/{id}/reactivate")
    public AccessLevelDto reactivateLevel(@PathVariable Long id) { return accessLevelService.reactivate(id); }

    @PutMapping("/access-levels/{id}/areas")
    public AccessLevelDto replaceAreas(@PathVariable Long id, @RequestBody @Valid AreaIdsRequest body) {
        return accessLevelService.replaceAreas(id, body.areaIds());
    }

    // ---------- matrix and rule test ----------

    @GetMapping("/permission-matrix")
    public PermissionMatrix matrix() { return accessLevelService.matrix(); }

    @PostMapping("/access-test")
    public AccessTestResult test(@RequestBody @Valid AccessTestRequest body) {
        return accessLevelService.test(body.levelId(), body.areaId());
    }

    // ---------- card-level assignment ----------

    @PutMapping("/cards/{cardId}/access-level")
    public AssignmentDto assign(@PathVariable Long cardId, @RequestBody @Valid AssignRequest body) {
        return accessLevelService.assign(cardId, body.levelId(), body.remarks());
    }

    @GetMapping("/cards/{cardId}/access-history")
    public List<AssignmentDto> history(@PathVariable Long cardId) {
        return accessLevelService.history(cardId);
    }
}
