package com.ecommerce.repository;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class UserRepository {
    // VULNERABILITY: Raw SQL concatenation (CWE-89)
    public String findByCustomFilter(String filterCriteria, Connection connection) throws SQLException {
        // Direct unsanitized input concatenated into query string
        String sql = "SELECT username, role FROM users WHERE active = 1 AND " + filterCriteria;
        Statement statement = connection.createStatement();
        ResultSet resultSet = statement.executeQuery(sql);

        if (resultSet.next()) {
            return resultSet.getString("username");
        }
        return null;
    }
}
