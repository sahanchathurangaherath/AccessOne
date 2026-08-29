package lk.AccessOne.dashboard.web;

import lk.AccessOne.dashboard.service.DashboardService;
import lk.AccessOne.dashboard.web.dto.AdminDashboard;
import lk.AccessOne.dashboard.web.dto.EmployeeDashboard;
import lk.AccessOne.dashboard.web.dto.HrDashboard;
import lk.AccessOne.dashboard.web.dto.ItDashboard;
import lk.AccessOne.dashboard.web.dto.PrintDashboard;
import lk.AccessOne.dashboard.web.dto.SecurityDashboard;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** One endpoint per role. SecurityConfig gates each path to the role it describes. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/employee")
    public EmployeeDashboard employee() { return service.employee(); }

    @GetMapping("/hr")
    public HrDashboard hr() { return service.hr(); }

    @GetMapping("/it")
    public ItDashboard it() { return service.it(); }

    @GetMapping("/security")
    public SecurityDashboard security() { return service.security(); }

    @GetMapping("/print")
    public PrintDashboard print() { return service.print(); }

    @GetMapping("/admin")
    public AdminDashboard admin() { return service.admin(); }
}
