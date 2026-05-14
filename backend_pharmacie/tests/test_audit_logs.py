import asyncio
import json

import pytest
from fastapi import HTTPException

import models
from routers import admin as admin_routes
from schemas import LoginRequest, RegisterRequest
from services.auth_service import AuthService


def _latest_audit(test_db, action):
    test_db.expire_all()
    return (
        test_db.query(models.AuditLog)
        .filter(models.AuditLog.action == action)
        .order_by(models.AuditLog.id.desc())
        .first()
    )


def test_admin_login_success_creates_audit_log(test_db, test_admin):
    response, error = AuthService(test_db).login(
        LoginRequest(email=test_admin.email, password="TestPassword123"),
        "127.0.0.1",
        "pytest-audit",
    )

    assert error is None
    assert response["access_token"]

    audit = _latest_audit(test_db, models.AuditActionEnum.ADMIN_LOGIN)
    assert audit is not None
    assert audit.entity_type == "administrateur"
    assert audit.entity_id == test_admin.id
    assert audit.actor_type == "administrateur"
    assert audit.actor_id == test_admin.id
    assert audit.status == "success"
    assert audit.user_agent == "pytest-audit"
    assert json.loads(audit.details)["email"] == test_admin.email


def test_failed_admin_login_creates_failed_audit_log(test_db, test_admin):
    response, error = AuthService(test_db).login(
        LoginRequest(email=test_admin.email, password="wrong-password"),
        "127.0.0.1",
        "pytest-audit",
    )

    assert response is None
    assert error == "Invalid credentials"

    audit = _latest_audit(test_db, models.AuditActionEnum.ADMIN_LOGIN_FAILED)
    assert audit is not None
    assert audit.entity_type == "administrateur"
    assert audit.entity_id == test_admin.id
    assert audit.actor_id is None
    assert audit.actor_type is None
    assert audit.status == "failed"
    assert json.loads(audit.details)["reason"] == "invalid_credentials"


def test_registration_creates_user_registered_audit_log(test_db):
    response, error = AuthService(test_db).register(
        RegisterRequest(
            email="new-user@test.com",
            password="TestPassword123",
            username="new_user",
        ),
        "127.0.0.1",
        "pytest-register",
    )

    assert error is None
    assert response["email"] == "new-user@test.com"

    user = test_db.query(models.Utilisateur).filter_by(email="new-user@test.com").one()
    audit = _latest_audit(test_db, models.AuditActionEnum.USER_REGISTERED)
    assert audit is not None
    assert audit.entity_type == "utilisateur"
    assert audit.entity_id == user.id
    assert audit.actor_type == "utilisateur"
    assert audit.actor_id == user.id
    assert audit.user_agent == "pytest-register"


def test_audit_log_count_uses_same_filters_as_list(test_db, test_admin):
    test_db.add_all(
        [
            models.AuditLog(
                action=models.AuditActionEnum.ADMIN_CREATED,
                entity_type="administrateur",
                entity_id=101,
                actor_id=test_admin.id,
                actor_type="administrateur",
                status="success",
            ),
            models.AuditLog(
                action=models.AuditActionEnum.USER_REGISTERED,
                entity_type="utilisateur",
                entity_id=202,
                actor_id=202,
                actor_type="utilisateur",
                status="success",
            ),
        ]
    )
    test_db.commit()

    params = {"action_type": "admin_created", "entity_type": "administrateur"}
    count_response = asyncio.run(
        admin_routes.get_audit_logs_count(
            current_admin=test_admin,
            db=test_db,
            **params,
        )
    )
    logs_response = asyncio.run(
        admin_routes.get_audit_logs(
            current_admin=test_admin,
            db=test_db,
            skip=0,
            limit=50,
            **params,
        )
    )

    assert count_response["total"] == 1
    assert len(logs_response) == 1
    assert logs_response[0]["action"] == "admin_created"


def test_audit_log_filters_reject_unknown_action(test_db, test_admin):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            admin_routes.get_audit_logs(
                current_admin=test_admin,
                db=test_db,
                action_type="not_a_real_action",
            )
        )

    assert exc.value.status_code == 400
