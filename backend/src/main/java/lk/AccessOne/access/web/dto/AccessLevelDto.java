package lk.AccessOne.access.web.dto;

import java.util.List;

public record AccessLevelDto(Long id, String levelCode, String levelName,
                             String description, boolean active,
                             List<AreaRef> permittedAreas) { }
