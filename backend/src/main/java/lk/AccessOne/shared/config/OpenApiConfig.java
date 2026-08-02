package lk.AccessOne.shared.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI accessOneOpenApi() {
        return new OpenAPI().info(new Info()
                .title("AccessOne API")
                .version("v1")
                .description("Corporate ID Card Issuing & Access Management System"));
    }
}
