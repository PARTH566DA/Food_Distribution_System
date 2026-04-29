package com.example.backend.repository;

import com.example.backend.model.Enums.Status;
import com.example.backend.model.FoodListing;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest // Configures H2 database, Hibernate, Spring Data, and an in-memory db automatically.
public class FoodListingRepositoryTest {

    @Autowired
    private FoodListingRepository foodListingRepository;

    @Test
    @org.junit.jupiter.api.Disabled("H2 does not support MySQL DATE_ADD natively without aliases")
    void findByStatusOrderByExpiryAsc_ShouldReturnSortedResults() {
        // given
        FoodListing listing1 = new FoodListing();
        listing1.setQuantity(20);
        listing1.setVegetarian(true);
        listing1.setIsPackaged(true);
        listing1.setExpiry(10);
        listing1.setStatus(Status.OPEN);
        listing1.setAddress("123 Main St");
        listing1.setDescription("Fresh food");
        listing1.setPickupLatitude(10.0);
        listing1.setPickupLongitude(20.0);

        FoodListing listing2 = new FoodListing();
        listing2.setQuantity(50);
        listing2.setVegetarian(false);
        listing2.setIsPackaged(false);
        listing2.setExpiry(5);
        listing2.setStatus(Status.OPEN);
        listing2.setAddress("456 Elm St");
        listing2.setDescription("Bakery items");
        listing2.setPickupLatitude(11.0);
        listing2.setPickupLongitude(21.0);

        foodListingRepository.save(listing1);
        foodListingRepository.save(listing2);

        // when
        Page<FoodListing> page = foodListingRepository.findByStatusOrderByExpiryAsc(
                Status.OPEN.name(), PageRequest.of(0, 10));

        // then
        assertEquals(2, page.getTotalElements());
        
        // Assert sorting by expiry ASC (5 should come before 10)
        assertEquals(5, page.getContent().get(0).getExpiry());
        assertEquals(10, page.getContent().get(1).getExpiry());
    }
}
