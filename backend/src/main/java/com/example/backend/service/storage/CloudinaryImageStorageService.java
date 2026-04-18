package com.example.backend.service.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "cloudinary")
public class CloudinaryImageStorageService implements ImageStorageService {

    @Value("${app.cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${app.cloudinary.api-key:}")
    private String apiKey;

    @Value("${app.cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.cloudinary.folder:food-distribution/food-images}")
    private String folder;

    @Value("${app.upload.allowed-types:image/jpeg,image/png,image/webp}")
    private String allowedTypes;

    @Value("${app.upload.max-size-bytes:5242880}")
    private long maxSizeBytes;

    @Override
    public String storeFoodImage(MultipartFile image) {
        validate(image);
        validateCloudinaryConfiguration();

        Cloudinary cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));

        try {
            Map<?, ?> response = cloudinary.uploader().upload(
                    image.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "image"
                    )
            );

            String secureUrl = response.get("secure_url") != null ? response.get("secure_url").toString() : null;
            if (secureUrl == null || secureUrl.isBlank()) {
                log.error("Cloudinary upload response missing secure_url for folder={}", folder);
                throw new RuntimeException("Image upload failed");
            }

            log.info("Image uploaded to cloud storage folder={}", folder);
            return secureUrl;
        } catch (IOException e) {
            log.error("Cloudinary image upload failed for folder={}", folder, e);
            throw new RuntimeException("Failed to upload image");
        }
    }

    private void validate(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        if (image.getSize() > maxSizeBytes) {
            throw new IllegalArgumentException("Image file is too large. Max size is " + (maxSizeBytes / (1024 * 1024)) + "MB");
        }

        Set<String> allowed = Arrays.stream(allowedTypes.split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());

        String contentType = image.getContentType();
        if (contentType == null || !allowed.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("Unsupported image type. Allowed types: " + allowedTypes);
        }
    }

    private void validateCloudinaryConfiguration() {
        if (isBlank(cloudName) || isBlank(apiKey) || isBlank(apiSecret)) {
            throw new IllegalStateException("Cloudinary is enabled but CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
