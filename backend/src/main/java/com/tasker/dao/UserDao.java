package com.tasker.dao;

import com.tasker.model.User;
import java.sql.*;
import java.util.Optional;
import javax.sql.DataSource;
import org.springframework.stereotype.Repository;

@Repository
public class UserDao {
  private final DataSource dataSource;
  public UserDao(DataSource dataSource) { this.dataSource = dataSource; }

  public Optional<User> findByEmail(String email) throws SQLException {
    String sql = "SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1";
    try (Connection c = dataSource.getConnection(); PreparedStatement p = c.prepareStatement(sql)) {
      p.setString(1, email);
      try (ResultSet r = p.executeQuery()) {
        return r.next() ? Optional.of(new User(r.getLong("id"), r.getString("name"),
            r.getString("email"), r.getString("password_hash"))) : Optional.empty();
      }
    }
  }

  public Optional<User> findById(long id) throws SQLException {
    String sql = "SELECT id, name, email, password_hash FROM users WHERE id = ?";
    try (Connection c = dataSource.getConnection(); PreparedStatement p = c.prepareStatement(sql)) {
      p.setLong(1, id);
      try (ResultSet r = p.executeQuery()) {
        return r.next() ? Optional.of(new User(r.getLong(1), r.getString(2), r.getString(3), r.getString(4))) : Optional.empty();
      }
    }
  }

  public User create(String name, String email, String hash) throws SQLException {
    String sql = "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)";
    try (Connection c = dataSource.getConnection(); PreparedStatement p = c.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
      p.setString(1, name); p.setString(2, email); p.setString(3, hash); p.executeUpdate();
      try (ResultSet keys = p.getGeneratedKeys()) {
        if (!keys.next()) throw new SQLException("Could not create user");
        return new User(keys.getLong(1), name, email, hash);
      }
    }
  }
}
