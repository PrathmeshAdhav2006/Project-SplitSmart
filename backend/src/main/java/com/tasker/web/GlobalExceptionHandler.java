package com.tasker.web;

import java.sql.SQLException;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {
  @ExceptionHandler(ApiException.class) ResponseEntity<?> api(ApiException e){return ResponseEntity.status(e.status).body(Map.of("status",e.status.value(),"message",e.getMessage(),"timestamp",java.time.Instant.now()));}
  @ExceptionHandler({HttpMessageNotReadableException.class,MethodArgumentTypeMismatchException.class})
  ResponseEntity<?> bad(Exception e){return ResponseEntity.badRequest().body(Map.of("error","Invalid request")); }
  @ExceptionHandler(SQLException.class) ResponseEntity<?> sql(SQLException e){return ResponseEntity.status(500).body(Map.of("error","Database error")); }
  @ExceptionHandler(Exception.class) ResponseEntity<?> other(Exception e){return ResponseEntity.status(500).body(Map.of("error","Internal server error")); }
}
