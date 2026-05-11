import asyncio
from datetime import date

import pytest
from fastapi import HTTPException

import models
from dependencies import admin_required
from routers import admin as admin_routes
from schemas import AssistantCreate, AssistantUpdate, GardeScheduleCreate, PharmacieCreate
from security import hash_password


def _create_assistant(test_db, region_scope="north"):
    assistant = models.Administrateur(
        nomUtilisateur=f"{region_scope}_assistant",
        email=f"{region_scope}_assistant@test.com",
        motDePasse=hash_password("TestPassword123"),
        role=models.AdminRoleEnum.ASSISTANT,
        region_scope=region_scope,
        is_active=True,
    )
    test_db.add(assistant)
    test_db.commit()
    test_db.refresh(assistant)
    return assistant


def test_admin_can_create_regional_assistant(test_db, test_admin):
    payload = AssistantCreate(
        nomUtilisateur="north_ops",
        email="north.ops@test.com",
        password="SecurePass123",
        region_scope="north",
    )

    response = asyncio.run(
        admin_routes.create_assistant(
            assistant_data=payload,
            current_admin=test_admin,
            db=test_db,
        )
    )

    assert response.role == models.AdminRoleEnum.ASSISTANT
    assert response.region_scope == "north"

    saved = test_db.query(models.Administrateur).filter_by(email="north.ops@test.com").one()
    assert saved.role == models.AdminRoleEnum.ASSISTANT
    assert saved.region_scope == "north"


def test_assistant_cannot_satisfy_admin_required(test_db):
    assistant = _create_assistant(test_db, region_scope="north")

    with pytest.raises(HTTPException) as exc:
        admin_required(assistant)

    assert exc.value.status_code == 403


def test_admin_can_update_assistant_region_status_and_password(test_db, test_admin):
    assistant = _create_assistant(test_db, region_scope="north")

    response = asyncio.run(
        admin_routes.update_assistant(
            assistant_id=assistant.id,
            assistant_data=AssistantUpdate(
                region_scope="south",
                is_active=False,
                password="NewPassword123",
            ),
            current_admin=test_admin,
            db=test_db,
        )
    )

    assert response["region_scope"] == "south"
    assert response["is_active"] is False

    test_db.refresh(assistant)
    assert assistant.region_scope == "south"
    assert assistant.is_active is False


def test_staff_can_fetch_region_options(test_db):
    assistant = _create_assistant(test_db, region_scope="middle")

    response = asyncio.run(admin_routes.get_regions(current_admin=assistant))

    assert [region["value"] for region in response["regions"]] == ["north", "middle", "south"]
    assert "Sfax" in next(
        region["governorates"]
        for region in response["regions"]
        if region["value"] == "middle"
    )


def test_assistant_pharmacy_access_is_limited_to_assigned_region(test_db, test_admin):
    assistant = _create_assistant(test_db, region_scope="north")
    test_db.add_all(
        [
            models.Pharmacie(
                name="North Pharmacy",
                latitude=36.8,
                longitude=10.1,
                governorate="Tunis",
                created_by=test_admin.id,
            ),
            models.Pharmacie(
                name="Middle Pharmacy",
                latitude=34.7,
                longitude=10.7,
                governorate="Sfax",
                created_by=test_admin.id,
            ),
        ]
    )
    test_db.commit()

    count_response = asyncio.run(
        admin_routes.get_pharmacies_count(current_admin=assistant, db=test_db)
    )
    assert count_response["total"] == 1

    list_response = asyncio.run(
        admin_routes.get_pharmacies(current_admin=assistant, db=test_db)
    )
    assert [item["name"] for item in list_response] == ["North Pharmacy"]

    create_response = asyncio.run(
        admin_routes.create_pharmacy(
            pharmacy=PharmacieCreate(
                name="Assistant North Pharmacy",
                governorate="Ariana",
                latitude=36.86,
                longitude=10.19,
            ),
            current_admin=assistant,
            db=test_db,
        )
    )
    assert create_response["created_by"] == assistant.id

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            admin_routes.create_pharmacy(
                pharmacy=PharmacieCreate(
                    name="Outside Region Pharmacy",
                    governorate="Sfax",
                    latitude=34.74,
                    longitude=10.76,
                ),
                current_admin=assistant,
                db=test_db,
            )
        )
    assert exc.value.status_code == 403


def test_assistant_garde_access_is_limited_to_assigned_region(test_db, test_admin):
    assistant = _create_assistant(test_db, region_scope="south")
    test_db.add_all(
        [
            models.GardeSchedule(
                date=date(2026, 5, 10),
                pharmacy_name="South Pharmacy",
                start_time="08:00",
                end_time="20:00",
                governorate="Gabes",
                created_by=test_admin.id,
            ),
            models.GardeSchedule(
                date=date(2026, 5, 10),
                pharmacy_name="North Pharmacy",
                start_time="08:00",
                end_time="20:00",
                governorate="Tunis",
                created_by=test_admin.id,
            ),
        ]
    )
    test_db.commit()

    list_response = asyncio.run(admin_routes.get_gardes(current_admin=assistant, db=test_db))
    assert [item["pharmacy_name"] for item in list_response] == ["South Pharmacy"]

    create_response = asyncio.run(
        admin_routes.create_garde(
            garde=GardeScheduleCreate(
                date="2026-05-11",
                pharmacy_name="Kebili Pharmacy",
                start_time="08:00",
                end_time="20:00",
                governorate="Kebili",
            ),
            current_admin=assistant,
            db=test_db,
        )
    )
    assert create_response["governorate"] == "Kebili"

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            admin_routes.create_garde(
                garde=GardeScheduleCreate(
                    date="2026-05-11",
                    pharmacy_name="Tunis Pharmacy",
                    start_time="08:00",
                    end_time="20:00",
                    governorate="Tunis",
                ),
                current_admin=assistant,
                db=test_db,
            )
        )
    assert exc.value.status_code == 403
