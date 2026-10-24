package com.tasker.web;
import java.time.LocalDate;
public final class Dto {
  private Dto(){}
  public record Register(String name,String email,String password){}
  public record Login(String email,String password){}
  public record TaskInput(String title,String description,String priority,String status,LocalDate dueDate){}
  public record StatusInput(String status){}
}
