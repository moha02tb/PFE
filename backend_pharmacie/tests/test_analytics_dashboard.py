import asyncio
from datetime import datetime, timedelta, timezone

import models
import schemas
from main import search_pharmacies
from routers import analytics


def test_create_search_event_public_endpoint(test_db):
    payload = schemas.SearchEventCreate(
        event_type="place_search",
        query_text="Sfax",
        location_label="Sfax, Tunisia",
        latitude=34.7406,
        longitude=10.7603,
        result_count=1,
    )
    response = asyncio.run(analytics.create_search_event(payload=payload, db=test_db))

    assert response["id"] > 0
    assert response["created_at"]

    stored = test_db.query(models.SearchEvent).one()
    assert stored.event_type == "place_search"
    assert stored.query_text == "Sfax"
    assert stored.location_label == "Sfax, Tunisia"


def test_search_pharmacies_endpoint_filters_by_query_and_governorate(test_db, test_admin):
    test_db.add_all(
        [
            models.Pharmacie(
                name="Pharmacie Centrale Tunis",
                address="Centre Ville",
                latitude=36.8,
                longitude=10.1,
                governorate="Tunis",
                created_by=test_admin.id,
            ),
            models.Pharmacie(
                name="Pharmacie Centrale Sfax",
                address="Route Gremda",
                latitude=34.7,
                longitude=10.7,
                governorate="Sfax",
                created_by=test_admin.id,
            ),
            models.Pharmacie(
                name="Pharmacie Lafayette",
                address="Lafayette",
                latitude=36.81,
                longitude=10.17,
                governorate="Tunis",
                created_by=test_admin.id,
            ),
        ]
    )
    test_db.commit()

    payload = asyncio.run(
        search_pharmacies(
            query="centrale",
            governorate="Tunis",
            limit=10,
            db=test_db,
        )
    )
    assert len(payload) == 1
    assert payload[0]["name"] == "Pharmacie Centrale Tunis"

    events = test_db.query(models.SearchEvent).all()
    assert len(events) == 1
    assert events[0].event_type == "pharmacy_text_search"
    assert events[0].query_text == "centrale"
    assert events[0].governorate == "Tunis"


def test_admin_dashboard_exposes_operational_metrics(test_db, test_admin):
    now = datetime.now(timezone.utc)

    verified_user = models.Utilisateur(
        nomUtilisateur="verified_user",
        email="verified@test.com",
        motDePasse="hashed",
        email_verified=True,
        created_at=now - timedelta(days=2),
    )
    unverified_user = models.Utilisateur(
        nomUtilisateur="pending_user",
        email="pending@test.com",
        motDePasse="hashed",
        email_verified=False,
        created_at=now - timedelta(days=1),
    )
    test_db.add_all([verified_user, unverified_user])
    test_db.flush()

    test_db.add_all(
        [
            models.Pharmacie(
                name="Pharmacie Tunis",
                latitude=36.8,
                longitude=10.1,
                governorate="Tunis",
                created_by=test_admin.id,
            ),
            models.Pharmacie(
                name="Pharmacie Sfax",
                latitude=34.7,
                longitude=10.7,
                governorate="Sfax",
                created_by=test_admin.id,
            ),
            models.Pharmacie(
                name="Pharmacie Missing Region",
                latitude=35.6,
                longitude=10.6,
                governorate=None,
                created_by=test_admin.id,
            ),
            models.LoginAttempt(
                email="verified@test.com",
                ip_address="127.0.0.1",
                success=True,
                attempted_at=now - timedelta(days=3),
            ),
            models.LoginAttempt(
                email="pending@test.com",
                ip_address="127.0.0.1",
                success=False,
                attempted_at=now - timedelta(days=2),
            ),
            models.SearchEvent(
                event_type="place_search",
                query_text="Tunis",
                location_label="Tunis",
                governorate="Tunis",
                result_count=1,
                created_at=now - timedelta(hours=2),
            ),
            models.SearchEvent(
                event_type="nearby_pharmacy_search",
                location_label="Tunis",
                governorate="Tunis",
                result_count=8,
                created_at=now - timedelta(days=1),
            ),
            models.SearchEvent(
                event_type="place_search",
                query_text="Sfax",
                location_label="Sfax",
                governorate="Sfax",
                result_count=1,
                created_at=now - timedelta(days=2),
            ),
        ]
    )
    test_db.commit()

    payload = asyncio.run(analytics.analytics_dashboard(current_admin=test_admin, db=test_db))

    assert payload["totals"]["users"] == 2
    assert payload["totals"]["pharmacies"] == 3
    assert payload["auth"]["unverified_users"] == 1
    assert payload["searches"]["today"] == 1
    assert payload["searches"]["last_7_days"] == 3
    assert payload["searches"]["average_per_day_last_7_days"] == round(3 / 7, 2)
    assert payload["pharmacies"]["missing_governorate_entries"] == 1
    assert payload["coverage"]["covered_governorates"] == 2
    assert "Ariana" in payload["coverage"]["missing_governorates"]

    top_locations = payload["searches"]["top_locations_last_30_days"]
    assert top_locations[0] == {"location": "Tunis", "count": 2}
    assert any(item == {"location": "Sfax", "count": 1} for item in top_locations)
