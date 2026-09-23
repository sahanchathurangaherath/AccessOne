package lk.AccessOne.ai.gatekeeper.service;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.organisation.domain.Employee;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class LeastPrivilegeRecommendationService {

    private final AccessLevelRepository accessLevelRepository;

    public LeastPrivilegeRecommendationService(AccessLevelRepository accessLevelRepository) {
        this.accessLevelRepository = accessLevelRepository;
    }

    public record Recommendation(
        Long accessLevelId,
        String accessLevelCode,
        String accessLevelName,
        String reasoning,
        int privilegeRiskScorePenalty, // 0 if safe, > 30 if requesting over-privileged access
        boolean isEscalation
    ) {}

    /**
     * Recommends least-privilege access based on department and role,
     * comparing against any requested level.
     */
    public Recommendation evaluate(Employee employee, AccessLevel requestedLevel) {
        String deptCode = employee.getDepartment() != null ? employee.getDepartment().getDeptCode() : "OPS";
        String designation = employee.getDesignation() != null ? employee.getDesignation().toLowerCase() : "";

        // Baseline access level determination
        String targetCode;
        if (designation.contains("director") || designation.contains("executive") || designation.contains("ceo")) {
            targetCode = "AL-EXEC";
        } else if ("IT".equalsIgnoreCase(deptCode) || designation.contains("engineer") || designation.contains("admin")) {
            targetCode = "AL-IT";
        } else if ("HR".equalsIgnoreCase(deptCode) || designation.contains("human resource")) {
            targetCode = "AL-HR";
        } else if ("FIN".equalsIgnoreCase(deptCode) || designation.contains("account")) {
            targetCode = "AL-FIN";
        } else {
            targetCode = "AL-GEN";
        }

        List<AccessLevel> allLevels = accessLevelRepository.findAll();
        Optional<AccessLevel> baselineMatch = allLevels.stream()
            .filter(l -> l.getLevelCode().equalsIgnoreCase(targetCode))
            .findFirst();

        AccessLevel recommended = baselineMatch.orElseGet(() ->
            allLevels.stream().filter(l -> "AL-GEN".equalsIgnoreCase(l.getLevelCode())).findFirst().orElse(null)
        );

        if (recommended == null && !allLevels.isEmpty()) {
            recommended = allLevels.get(0);
        }

        Long recommendedId = recommended != null ? recommended.getId() : null;
        String recommendedCode = recommended != null ? recommended.getLevelCode() : "AL-GEN";
        String recommendedName = recommended != null ? recommended.getLevelName() : "General Staff";

        // Check if requested access level exceeds baseline
        if (requestedLevel != null && !requestedLevel.getId().equals(recommendedId)) {
            // Assess risk of privilege escalation
            int requestedTier = getLevelTier(requestedLevel.getLevelCode());
            int baselineTier = getLevelTier(recommendedCode);

            if (requestedTier > baselineTier) {
                return new Recommendation(
                    recommendedId,
                    recommendedCode,
                    recommendedName,
                    "Privilege Escalation Warning: Employee requested '%s' (Tier %d) which exceeds the least-privilege security baseline for %s ('%s', Tier %d). Recommend least-privilege access instead."
                        .formatted(requestedLevel.getLevelName(), requestedTier, employee.getDesignation(), recommendedName, baselineTier),
                    45, // High penalty
                    true
                );
            }
        }

        return new Recommendation(
            recommendedId,
            recommendedCode,
            recommendedName,
            "Least-privilege match: Aligned with %s department and '%s' designation baseline."
                .formatted(deptCode, employee.getDesignation()),
            0,
            false
        );
    }

    private int getLevelTier(String levelCode) {
        if (levelCode == null) return 1;
        return switch (levelCode.toUpperCase()) {
            case "AL-VIS" -> 0;
            case "AL-GEN" -> 1;
            case "AL-FIN", "AL-HR" -> 2;
            case "AL-IT" -> 3;
            case "AL-EXEC" -> 4;
            default -> 1;
        };
    }
}
