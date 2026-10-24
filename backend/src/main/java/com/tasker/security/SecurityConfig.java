package com.tasker.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.*;

@Configuration
public class SecurityConfig {
  @Value("${app.cors.allowed-origin:http://localhost:5173}") private String origin;
  @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }
  @Bean CookieCsrfTokenRepository csrfTokens() { return CookieCsrfTokenRepository.withHttpOnlyFalse(); }
  @Bean SecurityFilterChain filterChain(HttpSecurity http, CookieCsrfTokenRepository csrf) throws Exception {
    http.cors(c -> c.configurationSource(corsConfigurationSource()))
      .csrf(c -> c.csrfTokenRepository(csrf))
      .authorizeHttpRequests(a -> a.requestMatchers("/api/auth/**","/api/csrf","/error").permitAll()
          .requestMatchers(HttpMethod.OPTIONS,"/**").permitAll().anyRequest().authenticated())
      .formLogin(f -> f.disable()).httpBasic(b -> b.disable())
      .logout(l -> l.logoutUrl("/api/auth/logout").logoutSuccessHandler((req,res,auth)->res.setStatus(204)));
    return http.build();
  }
  @Bean CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration c = new CorsConfiguration(); c.setAllowedOrigins(List.of(origin));
    c.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));
    c.setAllowedHeaders(List.of("Content-Type","X-XSRF-TOKEN")); c.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource s = new UrlBasedCorsConfigurationSource(); s.registerCorsConfiguration("/**",c); return s;
  }
}
