package com.example.backend.service;

import com.example.backend.model.Enums.Status;
import com.example.backend.model.FoodListing;
import com.example.backend.repository.FoodListingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoodListingServiceTest {

    @Mock
    private FoodListingRepository foodListingRepository;
    
    // We can mock other dependencies as needed by injecting them
    // For now we just focus on the core listing logic

    @InjectMocks
    private FoodListingService foodListingService;

    private FoodListing sampleListing;

    @BeforeEach
    void setUp() {
        sampleListing = new FoodListing();
        sampleListing.setFoodId(1L);
        sampleListing.setQuantity(50);
        sampleListing.setVegetarian(true);
        sampleListing.setIsPackaged(true);
        sampleListing.setExpiry(12);
        // sampleListing.setStatus(Status.OPEN.name()); // Assuming string enum, set if needed
    }

    @Test
    void getAvailableFoodListings_ShouldReturnPagedListings() {
        // given
        int page = 0;
        int size = 10;
        Pageable pageable = PageRequest.of(page, size);
        Page<FoodListing> expectedPage = new PageImpl<>(List.of(sampleListing));

        // Let's stub the repo call
        when(foodListingRepository.findByStatusOrderByExpiryAsc(eq(Status.OPEN.name()), any(Pageable.class)))
                .thenReturn(expectedPage);
        when(foodListingRepository.markExpiredListings()).thenReturn(0);

        // when
        Page<FoodListing> actualPage = foodListingService.getAvailableFoodListings(page, size);

        // then
        assertNotNull(actualPage);
        assertEquals(1, actualPage.getTotalElements());
        assertEquals(sampleListing.getFoodId(), actualPage.getContent().get(0).getFoodId());
        
        // Verify tracking of the repo interaction
        verify(foodListingRepository, times(1)).findByStatusOrderByExpiryAsc(anyString(), any(Pageable.class));
    }
}
