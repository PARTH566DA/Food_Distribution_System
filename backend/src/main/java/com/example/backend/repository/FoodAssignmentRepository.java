
import com.example.backend.model.FoodAssignment;
import com.example.backend.model.Enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FoodAssignmentRepository extends JpaRepository<FoodAssignment, Long> {

    List<FoodAssignment> findByStatus(AssignmentStatus status);

    List<FoodAssignment> findByVolunteerUserId(Long volunteerId);

    List<FoodAssignment> findByFoodListingFoodId(Long foodId);
}