package com.example.backend.service.storage;

import org.springframework.web.multipart.MultipartFile;

public interface ImageStorageService {
    String storeFoodImage(MultipartFile image);
}
