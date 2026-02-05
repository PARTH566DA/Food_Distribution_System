
import com.example.backend.model.FoodListing;
import com.example.backend.model.Enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FoodListingRepository extends JpaRepository<FoodListing, Long> {

    List<FoodListing> findByStatus(Status status);

    List<FoodListing> findByUserId(Long userId);

    List<FoodListing> findByTargetZoneNeedyZoneId(Long zoneId);
}