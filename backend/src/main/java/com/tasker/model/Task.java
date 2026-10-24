package com.tasker.model;
import java.time.*;
public record Task(long id,long userId,String title,String description,String priority,String status,
                   LocalDate dueDate,OffsetDateTime createdAt,OffsetDateTime updatedAt) {}
