package lk.AccessOne.shared.error;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.net.URI;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Not found", ex.getMessage(), "not-found");
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ProblemDetail handleBusinessRule(BusinessRuleException ex) {
        ProblemDetail pd = problem(HttpStatus.CONFLICT, "Rule violation",
                                   ex.getMessage(), "business-rule");
        pd.setProperty("code", ex.getCode());
        return pd;
    }

    /** Field-level validation. The frontend maps these straight onto form fields. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        ex.getBindingResult().getFieldErrors()
          .forEach(fe -> fieldErrors.putIfAbsent(fe.getField(), fe.getDefaultMessage()));

        ProblemDetail pd = problem(HttpStatus.BAD_REQUEST, "Validation failed",
                                   "One or more fields are invalid", "validation");
        pd.setProperty("fieldErrors", fieldErrors);
        return pd;
    }

    /**
     * "User does not exist" and "wrong password" return the same message —
     * differing responses let an attacker enumerate valid usernames.
     */
    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ProblemDetail handleBadCredentials(Exception ex) {
        return problem(HttpStatus.UNAUTHORIZED, "Authentication failed",
                       "Invalid username or password", "authentication");
    }

    @ExceptionHandler(DisabledException.class)
    public ProblemDetail handleDisabled(DisabledException ex) {
        return problem(HttpStatus.FORBIDDEN, "Account disabled",
                       "This account has been deactivated. Contact your administrator.",
                       "account-disabled");
    }

    @ExceptionHandler(LockedException.class)
    public ProblemDetail handleLocked(LockedException ex) {
        return problem(HttpStatus.FORBIDDEN, "Account locked",
                       "Too many failed sign-in attempts. Contact your administrator.",
                       "account-locked");
    }

    /** Routing 404 — unmapped URL. Kept as ProblemDetail rather than the Whitelabel page. */
    @ExceptionHandler(NoResourceFoundException.class)
    public ProblemDetail handleNoResource(NoResourceFoundException ex) {
        return problem(HttpStatus.NOT_FOUND, "Not found", "No such endpoint.", "not-found");
    }

    /** Routing 405 — right endpoint, wrong HTTP method. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ProblemDetail handleMethodNotAllowed(HttpRequestMethodNotSupportedException ex) {
        return problem(HttpStatus.METHOD_NOT_ALLOWED, "Method not allowed", ex.getMessage(), "method-not-allowed");
    }

    /**
     * The catch-all. The client gets a correlation id and nothing else; the
     * stack trace goes to the log.
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleUnexpected(Exception ex) {
        String correlationId = UUID.randomUUID().toString();
        log.error("Unhandled exception [{}]", correlationId, ex);

        ProblemDetail pd = problem(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error",
                                   "Something went wrong. Quote the reference when reporting this.",
                                   "internal");
        pd.setProperty("reference", correlationId);
        return pd;
    }

    private ProblemDetail problem(HttpStatus status, String title, String detail, String type) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, detail);
        pd.setTitle(title);
        pd.setType(URI.create("https://accessone.lk/errors/" + type));
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }
}
