package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.AuditEvent;

import java.util.List;

public interface AuditEventRepository {

    List<AuditEvent> findAll();

    AuditEvent save(AuditEvent event);
}
