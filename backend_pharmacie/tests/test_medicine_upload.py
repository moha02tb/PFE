from io import BytesIO

import models


def test_medicine_upload_creates_rows(client, test_db, admin_headers):
    csv_content = (
        "code_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n"
        "302344,MESONE Spray Nasal,19.550,12.960,E,MOMETASONE,N\n"
    ).encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["successful"] == 1
    assert payload["failed"] == 0

    saved = test_db.query(models.Medicine).filter_by(code_pct="302344").first()
    assert saved is not None
    assert saved.nom_commercial == "MESONE Spray Nasal"
    assert float(saved.prix_public_dt) == 19.0


def test_medicine_upload_upserts_existing_code_pct(client, test_db, admin_headers, test_admin):
    existing = models.Medicine(
        code_pct="105224",
        nom_commercial="OLD NAME",
        prix_public_dt=10.0,
        tarif_reference_dt=9.0,
        categorie_remboursement="A",
        dci="OLD",
        ap="Y",
        created_by=test_admin.id,
    )
    test_db.add(existing)
    test_db.commit()

    csv_content = (
        "code_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n"
        "105224,RISOMAX 0.05% SUSP. NASALE,16.625,15.120,E,MOMETASONE,N\n"
    ).encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 200
    updated = test_db.query(models.Medicine).filter_by(code_pct="105224").all()
    assert len(updated) == 1
    assert updated[0].nom_commercial == "RISOMAX 0.05% SUSP. NASALE"
    assert float(updated[0].tarif_reference_dt) == 15.12


def test_medicine_upload_rejects_invalid_price_rows(client, admin_headers):
    csv_content = (
        "code_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n"
        "105645,NASONEX,bad-price,15.120,E,MOMETASONE,N\n"
    ).encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 400
    assert "No valid medicines found in CSV" in response.json()["detail"]


def test_medicine_upload_rejects_missing_columns(client, admin_headers):
    csv_content = "code_pct,nom_commercial,dci,ap\n105645,NASONEX,MOMETASONE,N\n".encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 400
    assert "CSV missing required columns" in response.json()["detail"]


def test_medicine_upload_duplicate_in_same_file_last_row_wins(client, test_db, admin_headers):
    csv_content = (
        "code_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n"
        "105738,NASACORT OLD,19.499,19.440,E,TRIAMCINOLONE,N\n"
        "105738,NASACORT NEW,20.000,19.440,E,TRIAMCINOLONE,N\n"
    ).encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["successful"] == 1
    assert payload["failed"] == 0
    assert len(payload["warnings"]) == 1

    saved = test_db.query(models.Medicine).filter_by(code_pct="105738").all()
    assert len(saved) == 1
    assert saved[0].nom_commercial == "NASACORT NEW"


def test_public_medicine_search_and_detail_endpoints(client, test_db, test_admin):
    test_db.add_all(
        [
            models.Medicine(
                code_pct="302344",
                nom_commercial="MESONE Spray Nasal 50 mcg",
                prix_public_dt=19.550,
                tarif_reference_dt=12.960,
                categorie_remboursement="E",
                dci="MOMETASONE",
                ap="N",
                created_by=test_admin.id,
            ),
            models.Medicine(
                code_pct="105738",
                nom_commercial="NASACORT 2%",
                prix_public_dt=19.499,
                tarif_reference_dt=19.440,
                categorie_remboursement="E",
                dci="TRIAMCINOLONE",
                ap="N",
                created_by=test_admin.id,
            ),
        ]
    )
    test_db.commit()

    search_response = client.get("/api/medicines", params={"q": "mometa", "skip": 0, "limit": 20})
    assert search_response.status_code == 200
    search_payload = search_response.json()
    assert len(search_payload) == 1
    assert search_payload[0]["code_pct"] == "302344"

    count_response = client.get("/api/medicines/count", params={"q": "NASA"})
    assert count_response.status_code == 200
    assert count_response.json()["total"] == 1

    detail_response = client.get("/api/medicines/105738")
    assert detail_response.status_code == 200
    assert detail_response.json()["nom_commercial"] == "NASACORT 2%"


def test_public_medicine_search_supports_multi_word_queries_and_ranks_exact_code(client, test_db, test_admin):
    test_db.add_all(
        [
            models.Medicine(
                code_pct="302344",
                nom_commercial="MESONE Spray Nasal 50 mcg",
                prix_public_dt=19.550,
                tarif_reference_dt=12.960,
                categorie_remboursement="E",
                dci="MOMETASONE",
                ap="N",
                created_by=test_admin.id,
            ),
            models.Medicine(
                code_pct="302345",
                nom_commercial="MESONE Adult Spray",
                prix_public_dt=18.100,
                tarif_reference_dt=11.500,
                categorie_remboursement="E",
                dci="MOMETASONE",
                ap="N",
                created_by=test_admin.id,
            ),
            models.Medicine(
                code_pct="302346",
                nom_commercial="Another Nasal Product",
                prix_public_dt=10.000,
                tarif_reference_dt=8.000,
                categorie_remboursement="A",
                dci="MESONE",
                ap="N",
                created_by=test_admin.id,
            ),
        ]
    )
    test_db.commit()

    multi_word_response = client.get("/api/medicines", params={"q": "spray mesone", "skip": 0, "limit": 20})
    assert multi_word_response.status_code == 200
    multi_word_payload = multi_word_response.json()
    assert [item["code_pct"] for item in multi_word_payload[:2]] == ["302345", "302344"]

    exact_code_response = client.get("/api/medicines", params={"q": "302344", "skip": 0, "limit": 20})
    assert exact_code_response.status_code == 200
    exact_code_payload = exact_code_response.json()
    assert exact_code_payload[0]["code_pct"] == "302344"

    count_response = client.get("/api/medicines/count", params={"q": "spray mesone"})
    assert count_response.status_code == 200
    assert count_response.json()["total"] == 2


def test_medicine_upload_accepts_utf8_bom_headers(client, admin_headers):
    csv_content = (
        "\ufeffcode_pct,nom_commercial,prix_public_DT,tarif_reference_DT,categorie_remboursement,dci,ap\n"
        "302399,AFUCID Comp 250 MG BT 10,16.715,15.930,E,ACIDE FUSIDIQUE,N\n"
    ).encode("utf-8")

    response = client.post(
        "/api/admin/medicines/upload",
        headers=admin_headers,
        files={"fichier": ("medicines.csv", BytesIO(csv_content), "text/csv")},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["successful"] == 1
    assert payload["failed"] == 0
