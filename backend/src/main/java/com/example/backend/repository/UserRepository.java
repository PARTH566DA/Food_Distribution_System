package com.example.backend.repository;

import com.example.backend.model.User;
import com.example.backend.model.Enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailId(String emailId);
    Optional<User> findByMobileNumber(String mobileNumber);
    List<User> findByRole(Role role);
    List<User> findByActive(Boolean active);
    List<User> findByUserNameContainingIgnoreCase(String userName);
}
