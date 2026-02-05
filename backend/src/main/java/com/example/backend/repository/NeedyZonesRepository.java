
import com.example.backend.model.NeedyZones;
import com.example.backend.model.Enums.NeedyZoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface NeedyZonesRepository extends JpaRepository<NeedyZones, Long> {

    List<NeedyZones> findByStatus(NeedyZoneStatus status);

    List<NeedyZones> findByCreatedByUserId(Long userId);
}