package com.example.backend;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.time.ZoneId;
import java.util.TimeZone;

@EnableScheduling
@SpringBootApplication
public class BackendApplication {

    @Value("${app.timezone:Asia/Kolkata}")
    private String appTimezone;

    @PostConstruct
    void configureDefaultTimezone() {
        TimeZone.setDefault(TimeZone.getTimeZone(ZoneId.of(appTimezone)));
    }

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}

