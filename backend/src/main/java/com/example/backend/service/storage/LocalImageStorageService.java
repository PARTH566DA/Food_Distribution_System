package com.example.backend.service.storage;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@ConditionalOnMissingBean(ImageStorageService.class)
public class LocalImageStorageService implements ImageStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.public.base-url:}")
    private String publicBaseUrl;

    @Value("${app.upload.allowed-types:image/jpeg,image/png,image/webp}")
    private String allowedTypes;

    @Value("${app.upload.max-size-bytes:5242880}")
    private long maxSizeBytes;

    @Override
    public String storeFoodImage(MultipartFile image) {
        validate(image);

        String extension = resolveExtension(image);
        LocalDate today = LocalDate.now();
        String relativePath = "food-images/" + today.getYear() + "/" + today.getMonthValue() + "/" + today.getDayOfMonth() + "/" + UUID.randomUUID() + extension;

        Path uploadRoot = Paths.get(uploadDir);
        Path targetFile = uploadRoot.resolve(relativePath);

        try {
            Files.createDirectories(targetFile.getParent());
            Files.copy(image.getInputStream(), targetFile, StandardCopyOption.REPLACE_EXISTING);
            String publicPath = "/uploads/" + relativePath;
            return toPublicUrl(publicPath);
        } catch (IOException e) {
            log.error("Failed to store image at path={}", targetFile, e);
            throw new RuntimeException("Failed to store image");
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

    private String resolveExtension(MultipartFile image) {
        String contentType = image.getContentType();
        if ("image/png".equalsIgnoreCase(contentType)) return ".png";
        if ("image/webp".equalsIgnoreCase(contentType)) return ".webp";
        return ".jpg";
    }

    private String toPublicUrl(String publicPath) {
        if (publicBaseUrl == null || publicBaseUrl.isBlank()) {
            return publicPath;
        }

        String normalizedBase = publicBaseUrl.endsWith("/")
                ? publicBaseUrl.substring(0, publicBaseUrl.length() - 1)
                : publicBaseUrl;

        return normalizedBase + publicPath;
    }
}
