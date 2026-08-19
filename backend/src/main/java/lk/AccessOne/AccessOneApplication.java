package lk.AccessOne;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class AccessOneApplication {

    public static void main(String[] args) {
        /*
         * The JVM's default timezone otherwise follows the host OS (Sri
         * Lanka Standard Time, UTC+5:30 in production and in most dev
         * environments here). hibernate.jdbc.time_zone: UTC does not fully
         * cover LocalDateTime -- Hibernate still writes it shifted by the
         * JVM default and re-adds the same shift on read, which hides the
         * bug everywhere except a native query that compares a stored
         * column against SYSUTCDATETIME() directly (the on-site visitor
         * view, the visitor expiry stored procedure). Setting this before
         * the context starts is what makes new writes genuinely UTC.
         */
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(AccessOneApplication.class, args);
    }
}
