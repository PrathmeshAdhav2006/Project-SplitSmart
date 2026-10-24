package com.tasker.web;
import java.util.Map;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
@RestController
public class CsrfController {
  @GetMapping({"/api/csrf","/api/auth/csrf"}) public Map<String,String> csrf(CsrfToken token){return Map.of("token",token.getToken());}
}
