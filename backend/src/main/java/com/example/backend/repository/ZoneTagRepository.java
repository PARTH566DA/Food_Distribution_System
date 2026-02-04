package com.example.backend.repository;

import com.example.backend.model.ZoneTag;
import com.example.backend.model.Enums.TagReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ZoneTagRepository extends JpaRepository<ZoneTag, Long> {

    List<ZoneTag> findByNeedyZoneNeedyZoneId(Long needyZoneId);

    List<ZoneTag> findByTaggedByUserId(Long userId);

    List<ZoneTag> findByReason(TagReason reason);

}