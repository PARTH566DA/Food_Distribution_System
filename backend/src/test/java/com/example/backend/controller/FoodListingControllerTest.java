package com.example.backend.controller;

import com.example.backend.dto.ApiResponse;
import com.example.backend.dto.FoodListingDTO;
import com.example.backend.model.FoodListing;
import com.example.backend.service.FoodListingService;
import com.example.backend.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FoodListingController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for simple controller testing
public class FoodListingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private FoodListingService foodListingService;

    @MockBean
    private JwtService jwtService; // Often required if JwtAuthFilter is somewhat evaluated

    @Test
    void getFoodById_ShouldReturnFoodListing_WhenFound() throws Exception {
        // given
        Long foodId = 1L;
        FoodListing dummyListing = new FoodListing();
        dummyListing.setFoodId(foodId);
        dummyListing.setVegetarian(true);
        dummyListing.setQuantity(10);
        dummyListing.setIsPackaged(false);
        dummyListing.setExpiry(24);

        when(foodListingService.getFoodListingById(foodId)).thenReturn(dummyListing);

        // when & then
        mockMvc.perform(get("/api/food/{foodId}", foodId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.foodId").value("FOOD001"))
                .andExpect(jsonPath("$.data.vegetarian").value(true))
                .andExpect(jsonPath("$.data.quantity").value("10"));
    }

    @Test
    void getFoodById_ShouldReturn404_WhenNotFound() throws Exception {
        // given
        Long foodId = 99L;
        when(foodListingService.getFoodListingById(foodId))
                .thenThrow(new RuntimeException("Food listing not found with id: " + foodId));

        // when & then
        mockMvc.perform(get("/api/food/{foodId}", foodId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Food listing not found with id: 99"));
    }
}
