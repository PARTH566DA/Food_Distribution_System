sed -i '' '/public ResponseEntity<ApiResponse<AuthResponse>> loginVerify/c\
    @PostMapping("/login/verify")\
    public ResponseEntity<ApiResponse<AuthResponse>> loginVerify(@RequestBody VerifyOtpRequest request) {\
        log.info("API login verify requested email={}", maskEmail(request.getEmailId()));\
        AuthResponse user = authService.verifyLogin(request);\
        String token = user.getToken();\
        ResponseCookie cookie = ResponseCookie.from("token", token)\
                .httpOnly(true)\
                .secure(true)\
                .path("/")\
                .maxAge(7 * 24 * 60 * 60)\
                .sameSite("None")\
                .build();\
        return ResponseEntity.ok()\
                .header(HttpHeaders.SET_COOKIE, cookie.toString())\
                .body(new ApiResponse<>(true, "Login successful.", user));\
    }' ../backend/src/main/java/com/example/backend/controller/AuthController.java
