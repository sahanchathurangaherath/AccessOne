package lk.AccessOne.access.web.dto;

import java.util.List;

public record MatrixRow(Long levelId, String levelCode, String levelName,
                        boolean active, List<Boolean> permitted) { }
