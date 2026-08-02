package lk.AccessOne.shared.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    /**
     * Not auto-registered as an injectable bean by Spring Security unless
     * exposed explicitly — AuthController needs it to authenticate the JSON
     * login request.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http,
                                           SecurityContextRepository contextRepository)
            throws Exception {

        // Eagerly render the CSRF token so the cookie is always present for
        // the frontend to read. Without this, the token is deferred and the
        // very first state-changing request has nothing to send.
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(csrfHandler))

            // No CORS configuration anywhere: the Next.js rewrite proxy means
            // the browser only ever sees one origin. This is deliberate.
            .cors(AbstractHttpConfigurer::disable)

            // Without this, an anonymous request against a hasRole(...) rule
            // is "authenticated as ROLE_ANONYMOUS, wrong role" -> 403, not
            // 401. Disabling it makes "not logged in" and "wrong role"
            // produce the entry point and access-denied responses
            // respectively, consistently, everywhere.
            .anonymous(AbstractHttpConfigurer::disable)

            .securityContext(sc -> sc.securityContextRepository(contextRepository))

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(sf -> sf.changeSessionId())
                .maximumSessions(3))

            // Replaced by the JSON endpoints in AuthController.
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            .logout(logout -> logout
                .logoutUrl("/api/v1/auth/logout")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID")
                .logoutSuccessHandler((req, res, auth) -> res.setStatus(HttpServletResponse.SC_NO_CONTENT)))

            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) ->
                    writeProblem(res, HttpServletResponse.SC_UNAUTHORIZED,
                                 "Authentication required"))
                .accessDeniedHandler((req, res, e) ->
                    writeProblem(res, HttpServletResponse.SC_FORBIDDEN,
                                 "You do not have permission to perform this action")))

            .authorizeHttpRequests(auth -> auth

                // --- open ---
                .requestMatchers("/api/v1/auth/login",
                                 "/api/v1/auth/csrf").permitAll()
                .requestMatchers("/api/actuator/health").permitAll()

                // --- Module 1: employees raise and track their own requests ---
                .requestMatchers("/api/v1/requests/**")
                    .hasAnyRole("EMPLOYEE", "HR_MANAGER", "SYSTEM_ADMIN")

                // --- Module 2: verification and approval ---
                .requestMatchers("/api/v1/approvals/**")
                    .hasAnyRole("HR_MANAGER", "SYSTEM_ADMIN")

                // --- Module 3: departments, areas, access levels ---
                .requestMatchers("/api/v1/config/**")
                    .hasAnyRole("IT_ADMIN", "SYSTEM_ADMIN")

                // --- Module 4: card generation ---
                .requestMatchers("/api/v1/cards/**")
                    .hasAnyRole("IT_ADMIN", "HR_MANAGER", "SYSTEM_ADMIN")

                // --- Module 6: print production and dispatch ---
                .requestMatchers("/api/v1/print/**", "/api/v1/dispatch/**")
                    .hasAnyRole("PRINT_SUPERVISOR", "SYSTEM_ADMIN")

                // --- Module 5: visitors and temporary passes ---
                .requestMatchers("/api/v1/visitors/**", "/api/v1/passes/**")
                    .hasAnyRole("SECURITY_OFFICER", "SYSTEM_ADMIN")

                // --- shared: access decisions, logs, alerts, blacklist ---
                .requestMatchers("/api/v1/access/**", "/api/v1/alerts/**", "/api/v1/blacklist/**")
                    .hasAnyRole("SECURITY_OFFICER", "SYSTEM_ADMIN")

                // --- administration ---
                .requestMatchers("/api/v1/admin/**").hasRole("SYSTEM_ADMIN")
                .requestMatchers("/api/v1/audit/**", "/api/v1/meta/**")
                    .hasRole("SYSTEM_ADMIN")

                // --- development tooling: not a public surface ---
                .requestMatchers("/api/swagger-ui/**", "/api/swagger-ui.html", "/api/v3/api-docs/**")
                    .hasRole("SYSTEM_ADMIN")

                .anyRequest().authenticated());

        return http.build();
    }

    private void writeProblem(HttpServletResponse res, int status, String detail)
            throws java.io.IOException {
        res.setStatus(status);
        res.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        res.getWriter().write("""
            {"status":%d,"title":"%s","detail":"%s"}
            """.formatted(status, status == 401 ? "Unauthorized" : "Forbidden", detail));
    }
}
