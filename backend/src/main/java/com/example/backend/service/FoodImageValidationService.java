package com.example.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;

@Service
@Slf4j
public class FoodImageValidationService {

    private static final String FOOD_IMAGE_REJECTION_MESSAGE = "Only food images are allowed. Please upload a clear food photo.";
    private static final String TEMP_UNAVAILABLE_MESSAGE = "Image validation service is temporarily unavailable. Please try again.";

    private static final List<String> FOOD_KEYWORDS = List.of(
            "food", "dish", "meal", "cuisine", "snack", "dessert", "fruit", "vegetable",
            "pizza", "burger", "sandwich", "pasta", "noodle", "rice", "biryani", "salad",
            "soup", "bread", "cake", "chocolate", "ice cream", "chicken", "fish", "egg",
            "curry", "dal", "roti", "naan", "idli", "dosa", "samosa", "thali", "chapati",
            "paneer", "sabzi", "poha", "upma", "paratha", "lunch", "dinner", "breakfast",
            "plate", "platter", "bowl", "tray", "tiffin", "lunchbox", "container", "parcel",
            "takeout", "packed", "packaged", "cooked", "restaurant", "street food"
    );

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    @Value("${app.food-image-validation.enabled:true}")
    private boolean foodValidationEnabled;

    @Value("${app.food-image-validation.fail-open:true}")
    private boolean failOpen;

    @Value("${app.food-image-validation.provider:auto}")
    private String provider;

    @Value("${app.food-image-validation.threshold:0.10}")
    private double hfSingleLabelThreshold;

    @Value("${app.food-image-validation.total-threshold:0.22}")
    private double hfTotalThreshold;

    @Value("${app.food-image-validation.hf-url:https://api-inference.huggingface.co/models/nateraw/food}")
    private String huggingFaceUrl;

    @Value("${app.food-image-validation.hf-api-token:}")
    private String huggingFaceApiToken;

    @Value("${app.food-image-validation.openai-url:https://api.openai.com/v1/chat/completions}")
    private String openAiUrl;

    @Value("${app.food-image-validation.openai-model:gpt-4o-mini}")
    private String openAiModel;

    @Value("${app.food-image-validation.openai-api-key:}")
    private String openAiApiKey;

    @Value("${app.food-image-validation.openai-threshold:0.55}")
    private double openAiFoodThreshold;

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
            FoodDecision decision = evaluateImage(image);
            if (!decision.accepted()) {
                log.info("Food image validation rejected source={} confidence={} reason={}",
                        decision.source(), round(decision.confidence()), decision.reason());
                throw new IllegalArgumentException(FOOD_IMAGE_REJECTION_MESSAGE);
            }

            log.info("Food image validation passed source={} confidence={} reason={}",
                    decision.source(), round(decision.confidence()), decision.reason());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            if (failOpen) {
                log.warn("Food image validation unavailable; allowing upload due to fail-open setting error={}", e.getMessage());
                return;
            }
            log.warn("Food image validation failed and request blocked error={}", e.getMessage());
            throw new IllegalArgumentException(TEMP_UNAVAILABLE_MESSAGE);
        }
    }

    private FoodDecision evaluateImage(MultipartFile image) throws IOException, InterruptedException {
        String strategy = provider == null ? "auto" : provider.trim().toLowerCase(Locale.ROOT);

        if ("openai".equals(strategy)) {
            return evaluateWithOpenAi(image);
        }

        if ("hf".equals(strategy) || "huggingface".equals(strategy)) {
            return evaluateWithHuggingFace(image);
        }

        if (hasOpenAiKey()) {
            try {
                return evaluateWithOpenAi(image);
            } catch (Exception openAiError) {
                log.warn("OpenAI validation failed in auto mode; falling back to Hugging Face error={}", openAiError.getMessage());
                return evaluateWithHuggingFace(image);
            }
        }

        return evaluateWithHuggingFace(image);
    }

    private FoodDecision evaluateWithOpenAi(MultipartFile image) throws IOException, InterruptedException {
        if (!hasOpenAiKey()) {
            throw new IllegalStateException("OpenAI provider selected but APP_FOOD_IMAGE_VALIDATION_OPENAI_API_KEY is missing");
        }

        String contentType = image.getContentType() != null ? image.getContentType() : "application/octet-stream";
        String base64 = Base64.getEncoder().encodeToString(image.getBytes());
        String dataUrl = "data:" + contentType + ";base64," + base64;

        ObjectNode payload = objectMapper.createObjectNode();
        payload.put("model", openAiModel);
        payload.put("temperature", 0);
        payload.put("max_tokens", 150);
        payload.putObject("response_format").put("type", "json_object");

        ArrayNode messages = payload.putArray("messages");
        messages.addObject()
                .put("role", "system")
                .put("content", "You are a strict image classifier for a food donation app.");

        ObjectNode userMessage = messages.addObject();
        userMessage.put("role", "user");
        ArrayNode content = userMessage.putArray("content");
        content.addObject()
                .put("type", "text")
                .put("text", "Return JSON only: {\"isFood\": boolean, \"confidence\": number, \"reason\": string}. Mark isFood=true only when the image clearly contains edible food (cooked meal, thali, packed parcel/tiffin with food, dish on plate, groceries). Mark false for drawings, logos, people-only photos, objects, landscapes, screenshots, pets, or unclear images. confidence must be 0 to 1.");

        ObjectNode imageObject = content.addObject();
        imageObject.put("type", "image_url");
        imageObject.putObject("image_url").put("url", dataUrl);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(openAiUrl))
                .timeout(Duration.ofSeconds(25))
                .header("Authorization", "Bearer " + openAiApiKey.trim())
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload.toString()))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("OpenAI request failed with status " + response.statusCode());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String rawContent = root.path("choices").path(0).path("message").path("content").asText("");
        if (rawContent.isBlank()) {
            throw new IllegalStateException("OpenAI response content is empty");
        }

        JsonNode decisionNode = parseDecisionJson(rawContent);
        boolean isFood = parseBooleanFlexible(decisionNode.path("isFood"));
        double confidence = clamp01(decisionNode.path("confidence").asDouble(isFood ? 0.7 : 0.0));
        String reason = decisionNode.path("reason").asText("openai-classification");

        boolean accepted = isFood && confidence >= openAiFoodThreshold;
        return new FoodDecision(accepted, confidence, "openai", reason);
    }

    private FoodDecision evaluateWithHuggingFace(MultipartFile image) throws IOException, InterruptedException {
        JsonNode predictions = callHuggingFaceClassifier(image);
        FoodScoreSummary summary = extractFoodScores(predictions, image.getOriginalFilename());
        boolean accepted = summary.bestFoodScore() >= hfSingleLabelThreshold || summary.totalFoodScore() >= hfTotalThreshold;
        double confidence = clamp01(Math.max(summary.bestFoodScore(), summary.totalFoodScore()));
        String reason = "hf-best=" + round(summary.bestFoodScore()) + ",hf-total=" + round(summary.totalFoodScore());
        return new FoodDecision(accepted, confidence, "huggingface", reason);
    }

    private JsonNode callHuggingFaceClassifier(MultipartFile image) throws IOException, InterruptedException {
        HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                .uri(URI.create(huggingFaceUrl))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", image.getContentType() != null ? image.getContentType() : "application/octet-stream")
                .header("X-Wait-For-Model", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(image.getBytes()));

        if (huggingFaceApiToken != null && !huggingFaceApiToken.isBlank()) {
            requestBuilder.header("Authorization", "Bearer " + huggingFaceApiToken.trim());
        }

        HttpResponse<String> response = httpClient.send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException("HuggingFace request failed with status " + response.statusCode());
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

    private FoodScoreSummary extractFoodScores(JsonNode predictions, String fileName) {
        List<JsonNode> normalizedPredictions = normalizePredictionItems(predictions);
        double bestFoodScore = 0.0;
        double totalFoodScore = 0.0;

        for (JsonNode prediction : normalizedPredictions) {
            String label = prediction.path("label").asText("");
            double score = prediction.path("score").asDouble(0.0);

            if (isFoodLabel(label)) {
                bestFoodScore = Math.max(bestFoodScore, score);
                totalFoodScore += score;
            }
        }

        if (bestFoodScore > 0.0) {
            return new FoodScoreSummary(bestFoodScore, totalFoodScore);
        }

        if (looksLikeFoodFilename(fileName)) {
            return new FoodScoreSummary(0.10, 0.10);
        }

        return new FoodScoreSummary(0.0, 0.0);
    }

    private List<JsonNode> normalizePredictionItems(JsonNode predictions) {
        List<JsonNode> items = new ArrayList<>();

        for (JsonNode node : predictions) {
            if (node.isObject() && node.has("label")) {
                items.add(node);
                continue;
            }
            if (node.isArray()) {
                for (JsonNode nested : node) {
                    if (nested.isObject() && nested.has("label")) {
                        items.add(nested);
                    }
                }
            }
        }

        return items;
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

    private JsonNode parseDecisionJson(String rawContent) throws IOException {
        try {
            return objectMapper.readTree(rawContent);
        } catch (Exception ignored) {
            int start = rawContent.indexOf('{');
            int end = rawContent.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return objectMapper.readTree(rawContent.substring(start, end + 1));
            }
            throw new IOException("Unable to parse JSON from model response");
        }
    }

    private boolean parseBooleanFlexible(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return false;
        }
        if (node.isBoolean()) {
            return node.asBoolean();
        }

        String value = node.asText("").trim().toLowerCase(Locale.ROOT);
        return "true".equals(value) || "yes".equals(value) || "food".equals(value);
    }

    private boolean hasOpenAiKey() {
        return openAiApiKey != null && !openAiApiKey.isBlank();
    }

    private double clamp01(double value) {
        if (value < 0) return 0;
        return Math.min(value, 1);
    }

    private double round(double value) {
        return Math.round(value * 1000.0) / 1000.0;
    }

    private record FoodScoreSummary(double bestFoodScore, double totalFoodScore) {}
    private record FoodDecision(boolean accepted, double confidence, String source, String reason) {}
}