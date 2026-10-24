package com.tasker.web;

import com.tasker.dao.UserDao;
import com.tasker.model.User;
import jakarta.servlet.http.*;
import java.sql.SQLException;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth")
public class AuthController {
  private final UserDao users; private final PasswordEncoder encoder;
  public AuthController(UserDao users,PasswordEncoder encoder){this.users=users;this.encoder=encoder;}
  @PostMapping("/register") ResponseEntity<?> register(@RequestBody Dto.Register in,HttpServletRequest req,HttpServletResponse res) throws SQLException {
    if (in == null) throw new ApiException(HttpStatus.BAD_REQUEST,"Registration details are required");
    String email = in.email() == null ? "" : in.email().trim().toLowerCase(java.util.Locale.ROOT);
    if(in.name()==null||in.name().isBlank()||email.isBlank()||!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")||in.password()==null||in.password().length()<8)
      throw new ApiException(HttpStatus.BAD_REQUEST,"Name, valid email and password of at least 8 characters are required");
    if(users.findByEmail(email).isPresent()) throw new ApiException(HttpStatus.CONFLICT,"User already exists");
    User u=users.create(in.name().trim(),email,encoder.encode(in.password())); authenticate(u,req,res);
    return ResponseEntity.status(201).body(Map.of("id",u.id(),"name",u.name(),"email",u.email()));
  }
  @PostMapping("/login") Map<String,Object> login(@RequestBody Dto.Login in,HttpServletRequest req,HttpServletResponse res) throws SQLException {
    if (in == null) throw new ApiException(HttpStatus.UNAUTHORIZED,"Invalid credentials");
    String email = in.email() == null ? "" : in.email().trim().toLowerCase(java.util.Locale.ROOT);
    User u=users.findByEmail(email).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"Invalid credentials"));
    if(in.password()==null||!encoder.matches(in.password(),u.passwordHash())) throw new ApiException(HttpStatus.UNAUTHORIZED,"Invalid credentials");
    authenticate(u,req,res); return Map.of("id",u.id(),"name",u.name(),"email",u.email());
  }
  @GetMapping("/me") Map<String,Object> me(HttpServletRequest req) throws SQLException { User u=current(req); return Map.of("id",u.id(),"name",u.name(),"email",u.email()); }
  @PostMapping("/logout") ResponseEntity<?> logout(HttpServletRequest req,HttpServletResponse res){SecurityContextHolder.clearContext();var s=req.getSession(false);if(s!=null)s.invalidate();return ResponseEntity.noContent().build();}
  private User current(HttpServletRequest req) throws SQLException {
    var a=SecurityContextHolder.getContext().getAuthentication(); if(a==null||!a.isAuthenticated()||!(a.getPrincipal() instanceof UserPrincipal p)) throw new ApiException(HttpStatus.UNAUTHORIZED,"Authentication required");
    return users.findById(p.id()).orElseThrow(()->new ApiException(HttpStatus.UNAUTHORIZED,"Authentication required"));
  }
  private void authenticate(User u,HttpServletRequest req,HttpServletResponse res) {
    var auth=new UsernamePasswordAuthenticationToken(new UserPrincipal(u),null,java.util.List.of());
    SecurityContextHolder.getContext().setAuthentication(auth);
    new HttpSessionSecurityContextRepository().saveContext(SecurityContextHolder.getContext(),req,res);
  }
  public record UserPrincipal(long id,String name) { UserPrincipal(User u){this(u.id(),u.name());} }
}
