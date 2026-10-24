package com.tasker.web;

import com.tasker.dao.TaskDao;
import com.tasker.web.AuthController.UserPrincipal;
import java.sql.SQLException;
import java.util.*;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/tasks")
public class TaskController {
  private final TaskDao tasks; public TaskController(TaskDao tasks){this.tasks=tasks;}
  private long uid(){var a=SecurityContextHolder.getContext().getAuthentication();return ((UserPrincipal)a.getPrincipal()).id();}
  @GetMapping List<?> all(@RequestParam(required=false) String search,@RequestParam(required=false) String status,@RequestParam(required=false) String priority,@RequestParam(defaultValue="createdAt") String sortBy,@RequestParam(defaultValue="desc") String order) throws SQLException { validateEnums(status,priority,sortBy,order); return tasks.findAll(uid(),search,status,priority,sortBy,order);}
  @GetMapping("/stats") Map<String,Long> stats() throws SQLException{return tasks.stats(uid());}
  @GetMapping("/{id}") Object one(@PathVariable long id) throws SQLException{return tasks.find(id,uid()).orElseThrow(()->new ApiException(HttpStatus.NOT_FOUND,"Task not found"));}
  @PostMapping ResponseEntity<?> create(@RequestBody Dto.TaskInput in) throws SQLException {validate(in); return ResponseEntity.status(201).body(tasks.insert(uid(),in.title().trim(),in.description(),in.priority(),in.status(),in.dueDate()));}
  @PutMapping("/{id}") Object update(@PathVariable long id,@RequestBody Dto.TaskInput in) throws SQLException {validate(in);if(!tasks.update(id,uid(),in.title().trim(),in.description(),in.priority(),in.status(),in.dueDate()))throw new ApiException(HttpStatus.NOT_FOUND,"Task not found");return tasks.find(id,uid()).orElseThrow();}
  @PatchMapping("/{id}/status") Object patch(@PathVariable long id,@RequestBody Dto.StatusInput in) throws SQLException {if(in==null||in.status()==null||!Set.of("PENDING","IN_PROGRESS","COMPLETED").contains(in.status()))throw new ApiException(HttpStatus.BAD_REQUEST,"Invalid status");if(!tasks.updateStatus(id,uid(),in.status()))throw new ApiException(HttpStatus.NOT_FOUND,"Task not found");return tasks.find(id,uid()).orElseThrow();}
  @DeleteMapping("/{id}") ResponseEntity<?> delete(@PathVariable long id) throws SQLException {if(!tasks.delete(id,uid()))throw new ApiException(HttpStatus.NOT_FOUND,"Task not found");return ResponseEntity.noContent().build();}
  private void validate(Dto.TaskInput in){if(in==null||in.title()==null||in.title().isBlank()||in.title().length()>150||in.priority()==null||in.status()==null||!Set.of("LOW","MEDIUM","HIGH").contains(in.priority())||!Set.of("PENDING","IN_PROGRESS","COMPLETED").contains(in.status()))throw new ApiException(HttpStatus.BAD_REQUEST,"Invalid task fields");}
  private void validateEnums(String s,String p,String sort,String order){if(s!=null&&!Set.of("PENDING","IN_PROGRESS","COMPLETED").contains(s)||p!=null&&!Set.of("LOW","MEDIUM","HIGH").contains(p)||!Set.of("createdAt","dueDate").contains(sort)||!Set.of("asc","desc").contains(order))throw new ApiException(HttpStatus.BAD_REQUEST,"Invalid filter");}
}
