import models
from schemas import AdminCreate
from services.admin_service import AdminService


def test_regular_user_token_cannot_access_admin_endpoint(client, test_user, user_headers, test_db):
    """A utilisateur token with the same numeric id as an admin must not pass admin auth."""
    colliding_admin = models.Administrateur(
        id=test_user.id,
        nomUtilisateur="colliding_admin",
        email="colliding-admin@test.com",
        motDePasse="hashed",
        role=models.AdminRoleEnum.ADMIN,
        is_active=True,
    )
    test_db.add(colliding_admin)
    test_db.commit()

    response = client.get("/api/admin/admins", headers=user_headers)

    assert response.status_code == 403


def test_admin_cannot_create_super_admin(test_db, test_admin):
    service = AdminService(test_db)

    created, error = service.create_admin(
        AdminCreate(
            nomUtilisateur="created_super_admin",
            email="created-super-admin@test.com",
            password="SecurePass123",
            role="super_admin",
        ),
        created_by_admin_id=test_admin.id,
    )

    assert created is None
    assert error == "Only super admins can create super admin accounts"


def test_super_admin_can_create_super_admin(test_db):
    super_admin = models.Administrateur(
        nomUtilisateur="root_admin",
        email="root-admin@test.com",
        motDePasse="hashed",
        role=models.AdminRoleEnum.SUPER_ADMIN,
        is_active=True,
    )
    test_db.add(super_admin)
    test_db.commit()
    test_db.refresh(super_admin)

    created, error = AdminService(test_db).create_admin(
        AdminCreate(
            nomUtilisateur="second_super_admin",
            email="second-super-admin@test.com",
            password="SecurePass123",
            role="super_admin",
        ),
        created_by_admin_id=super_admin.id,
    )

    assert error is None
    assert str(created.role) == "super_admin"
