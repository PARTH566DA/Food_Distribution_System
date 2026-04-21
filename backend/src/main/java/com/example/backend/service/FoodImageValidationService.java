package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class FoodImageValidationService {

    private static final String FOOD_IMAGE_REJECTION_MESSAGE = "Only food images are allowed. Please upload a clear food photo.";

    private static final List<String> FOOD_KEYWORDS = List.of(
            "food", "dish", "meal", "cuisine", "snack", "dessert", "fruit", "vegetable",
            "pizza", "burger", "sandwich", "pasta", "noodle", "rice", "biryani", "salad",
            "soup", "bread", "cake", "chocolate", "ice cream", "chicken", "fish", "egg",
            "curry", "dal", "roti", "naan", "idli", "dosa", "samosa", "thali"
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.food-image-validation.enabled:true}")
    private boolean foodValidationEnabled;

    @Value("${app.food-image-validation.fail-open:false}")
    private boolean failOpen;

    @Value("${app.food-image-validation.threshold:0.18}")
    private double foodThreshold;

    @Value("${app.food-image-validation.hf-url:https://api-inference.huggingface.co/models/microsoft/resnet-50}")
    private String huggingFaceUrl;

    @Value("${app.food-image-validation.hf-api-token:}")
    private String huggingFaceApiToken;

    public FoodImageValidationService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(8))
                .build();
    }

    public void validateAsFoodOrThrow(MultipartFile image) {
        if (!foodValidationEnabled || image == null || image.isEmpty()) {
            return;
        }

        try {
            double topFoodScore = extractTopFoodScore(callClassifier(image), image.getOriginalFilename());
            if (topFoodScore < foodThreshold) {
                throw new IllegalArgumentException(FOOD_IMAGE_REJECTION_MESSAGE);
            }
            log.info("Food image validation passed score={} threshold={}", round(topFoodScore), round(foodThreshold));
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            if (failOpen) {
                log.warn("Food image validation unavailable; allowing upload due to fail-open setting error={}", e.getMessage());
                return;
            }
            log.warn("Food image validation failed and request blocked error={}", e.getMessage());
            throw new IllegalArgumentException("Image validation service is temporarily unavailable. Please try again.");
        }
    }

    private JsonNode callClassifier(MultipartFile image) throws IOException, InterruptedException {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(huggingFaceUrl))
                .timeout(Duration.ofSeconds(15))
                .header("Content-Type", image.getContentType() != null ? image.getContentType() : "application/octet-stream")
                .POST(HttpRequest.BodyPublishers.ofByteArray(image.getBytes()));

        if (huggingFaceApiToken != null && !huggingFaceApiToken.isBlank()) {
            requestBuilder.header("Authorization", "Bearer " + huggingFaceApiToken.trim());
        }

        HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("Classifier request failed with status " + response.statusCode());
        }

        JsonNode payload = objectMapper.readTree(response.body());
        if (payload.isObject() && payload.has("error")) {
            throw new IllegalStateException(payload.path("error").asText("Classifier error"));
        }
        if (!payload.isArray()) {
            throw new IllegalStateException("Unexpected classifier response");
        }
        return payload;
    }

    private double extractTopFoodScore(JsonNode predictions, String fileName) {
        double bestFoodScore = 0.0;

        for (JsonNode prediction : predictions) {
            String label = prediction.path("label").asText("");
            double score = prediction.path("score").asDouble(0.0);

            if (isFoodLabel(label)) {
                bestFoodScore = Math.max(bestFoodScore, score);
            }
        }

        if (bestFoodScore > 0.0) {
            return bestFoodScore;
        }

        if (looksLikeFoodFilename(fileName)) {
            return 0.10;
        }

        return 0.0;
    }

    private boolean isFoodLabel(String label) {
        if (label == null || label.isBlank()) {
            return false;
        }

        String normalized = label.toLowerCase(Locale.ROOT);
        for (String keyword : FOOD_KEYWORDS) {
            if (normalized.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean looksLikeFoodFilename(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return false;
        }
        String normalized = fileName.toLowerCase(Locale.ROOT);
        return normalized.contains("food") || normalized.contains("meal") || normalized.contains("dish");
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }
}