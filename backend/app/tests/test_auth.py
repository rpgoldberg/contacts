from httpx import AsyncClient


class TestAuthentication:
    """Test authentication requirements."""

    async def test_unauthenticated_persons_returns_401(self, client: AsyncClient):
        """Endpoints require authentication."""
        response = await client.get("/api/v1/persons/")
        assert response.status_code == 401

    async def test_unauthenticated_upcoming_returns_401(self, client: AsyncClient):
        """Upcoming endpoint requires authentication."""
        response = await client.get("/api/v1/upcoming/all")
        assert response.status_code == 401

    async def test_invalid_credentials_returns_401(self, client: AsyncClient, test_user):
        """Invalid credentials return 401."""
        response = await client.get(
            "/api/v1/persons/",
            headers={"Authorization": "Basic d3Jvbmc6Y3JlZHM="}  # wrong:creds
        )
        assert response.status_code == 401

    async def test_valid_credentials_returns_200(self, authenticated_client: AsyncClient):
        """Valid credentials allow access."""
        response = await authenticated_client.get("/api/v1/persons/")
        assert response.status_code == 200

    async def test_get_me_returns_user_info(self, authenticated_client: AsyncClient):
        """Get current user info."""
        response = await authenticated_client.get("/api/v1/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "testuser"
        assert data["is_active"] is True


class TestAuthorization:
    """Test authorization - users can only see their own data."""

    async def test_user_sees_own_contacts(self, authenticated_client: AsyncClient):
        """User can see contacts they own."""
        # Create a contact
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={"first_name": "My", "last_name": "Contact"}
        )
        assert response.status_code == 201

        # List contacts - should see the one we created
        response = await authenticated_client.get("/api/v1/persons/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "My"

    async def test_user_cannot_see_other_user_contacts(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient
    ):
        """User cannot see contacts owned by another user."""
        # Create contact as first user
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={"first_name": "Private", "last_name": "Contact"}
        )
        assert response.status_code == 201
        contact_id = response.json()["id"]

        # Other user should not see this contact in list
        response = await other_authenticated_client.get("/api/v1/persons/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

        # Other user should not be able to get this contact directly
        response = await other_authenticated_client.get(f"/api/v1/persons/{contact_id}")
        assert response.status_code == 404

    async def test_user_cannot_modify_other_user_contacts(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient
    ):
        """User cannot modify contacts owned by another user."""
        # Create contact as first user
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={"first_name": "Protected", "last_name": "Contact"}
        )
        contact_id = response.json()["id"]

        # Other user should not be able to update
        response = await other_authenticated_client.put(
            f"/api/v1/persons/{contact_id}",
            json={"first_name": "Hacked"}
        )
        assert response.status_code == 404

        # Other user should not be able to delete
        response = await other_authenticated_client.delete(f"/api/v1/persons/{contact_id}")
        assert response.status_code == 404


class TestUpcomingAuth:
    """Test upcoming endpoints have proper auth."""

    async def test_upcoming_birthdays_requires_auth(self, client: AsyncClient):
        """Birthdays endpoint requires auth."""
        response = await client.get("/api/v1/upcoming/birthdays")
        assert response.status_code == 401

    async def test_upcoming_anniversaries_requires_auth(self, client: AsyncClient):
        """Anniversaries endpoint requires auth."""
        response = await client.get("/api/v1/upcoming/anniversaries")
        assert response.status_code == 401

    async def test_upcoming_all_requires_auth(self, client: AsyncClient):
        """All events endpoint requires auth."""
        response = await client.get("/api/v1/upcoming/all")
        assert response.status_code == 401

    async def test_upcoming_only_shows_owned_events(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient
    ):
        """Upcoming events only show for owned contacts."""
        from datetime import date, timedelta

        # Create contact with birthday as first user
        future_date = date.today() + timedelta(days=5)
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={
                "first_name": "Birthday",
                "last_name": "Person",
                "birth_date": f"1990-{future_date.month:02d}-{future_date.day:02d}"
            }
        )
        assert response.status_code == 201

        # First user should see the birthday
        response = await authenticated_client.get("/api/v1/upcoming/birthdays?days=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1

        # Other user should NOT see the birthday
        response = await other_authenticated_client.get("/api/v1/upcoming/birthdays?days=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0


class TestPasswordChange:
    """Test password change functionality."""

    async def test_change_password_success(self, authenticated_client: AsyncClient, client: AsyncClient):
        """User can change their password."""
        response = await authenticated_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "testpass",
                "new_password": "newpass123"
            }
        )
        assert response.status_code == 200

        # Old password should no longer work
        import base64
        old_creds = base64.b64encode(b"testuser:testpass").decode()
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Basic {old_creds}"}
        )
        assert response.status_code == 401

        # New password should work
        new_creds = base64.b64encode(b"testuser:newpass123").decode()
        response = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Basic {new_creds}"}
        )
        assert response.status_code == 200

    async def test_change_password_wrong_current(self, authenticated_client: AsyncClient):
        """Cannot change password with wrong current password."""
        response = await authenticated_client.post(
            "/api/v1/auth/change-password",
            json={
                "current_password": "wrongpass",
                "new_password": "newpass123"
            }
        )
        assert response.status_code == 400
        assert "incorrect" in response.json()["detail"].lower()


class TestRegistration:
    """Test user registration."""

    async def test_register_new_user(self, client: AsyncClient):
        """Can register a new user."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": "newuser", "password": "newpass"}
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["is_active"] is True

    async def test_register_duplicate_username(self, client: AsyncClient, test_user):
        """Cannot register with existing username."""
        response = await client.post(
            "/api/v1/auth/register",
            json={"username": "testuser", "password": "somepass"}
        )
        assert response.status_code == 400
        assert "already" in response.json()["detail"].lower()


class TestSharing:
    """Test contact sharing functionality."""

    async def test_share_with_user(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """User can share contacts with another user."""
        response = await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "otheruser" in data["shared_with"]

    async def test_share_with_nonexistent_user(self, authenticated_client: AsyncClient):
        """Cannot share with non-existent user."""
        response = await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "nobody"}
        )
        assert response.status_code == 404

    async def test_share_with_self(self, authenticated_client: AsyncClient):
        """Cannot share with yourself."""
        response = await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "testuser"}
        )
        assert response.status_code == 400
        assert "yourself" in response.json()["detail"].lower()

    async def test_share_duplicate(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """Cannot share twice with same user."""
        # First share
        await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )
        # Second share should fail
        response = await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )
        assert response.status_code == 400
        assert "already" in response.json()["detail"].lower()

    async def test_unshare_with_user(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """User can remove sharing."""
        # First share
        await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )
        # Then unshare
        response = await authenticated_client.delete("/api/v1/auth/share/otheruser")
        assert response.status_code == 200

    async def test_unshare_not_shared(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """Cannot unshare with user not shared with."""
        response = await authenticated_client.delete("/api/v1/auth/share/otheruser")
        assert response.status_code == 400
        assert "not shared" in response.json()["detail"].lower()

    async def test_shared_user_can_see_contacts(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient,
    ):
        """When user A shares with user B, B can see A's contacts."""
        # Create contact as testuser
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={"first_name": "Shared", "last_name": "Contact"}
        )
        assert response.status_code == 201
        contact_id = response.json()["id"]

        # Before sharing, otheruser cannot see the contact
        response = await other_authenticated_client.get("/api/v1/persons/")
        assert len(response.json()) == 0

        # Share with otheruser
        await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )

        # Now otheruser should see testuser's contacts
        response = await other_authenticated_client.get("/api/v1/persons/")
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Shared"

        # And can get the contact directly
        response = await other_authenticated_client.get(f"/api/v1/persons/{contact_id}")
        assert response.status_code == 200

    async def test_shared_user_can_modify_contacts(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient,
    ):
        """When user A shares with user B, B can modify A's contacts."""
        # Create contact as testuser
        response = await authenticated_client.post(
            "/api/v1/persons/",
            json={"first_name": "Original", "last_name": "Name"}
        )
        contact_id = response.json()["id"]

        # Share with otheruser
        await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )

        # Other user can update the contact
        response = await other_authenticated_client.put(
            f"/api/v1/persons/{contact_id}",
            json={"first_name": "Updated"}
        )
        assert response.status_code == 200
        assert response.json()["first_name"] == "Updated"

        # Other user can delete the contact
        response = await other_authenticated_client.delete(f"/api/v1/persons/{contact_id}")
        assert response.status_code == 204

    async def test_shared_upcoming_events_visible(
        self,
        authenticated_client: AsyncClient,
        other_authenticated_client: AsyncClient,
    ):
        """When user A shares with user B, B sees A's upcoming events."""
        from datetime import date, timedelta

        # Create contact with birthday as testuser
        future_date = date.today() + timedelta(days=5)
        await authenticated_client.post(
            "/api/v1/persons/",
            json={
                "first_name": "Birthday",
                "last_name": "Person",
                "birth_date": f"1990-{future_date.month:02d}-{future_date.day:02d}"
            }
        )

        # Before sharing, otheruser sees no birthdays
        response = await other_authenticated_client.get("/api/v1/upcoming/birthdays?days=10")
        assert len(response.json()) == 0

        # Share with otheruser
        await authenticated_client.post(
            "/api/v1/auth/share",
            json={"username": "otheruser"}
        )

        # Now otheruser should see the birthday
        response = await other_authenticated_client.get("/api/v1/upcoming/birthdays?days=10")
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Person, Birthday"


class TestUserSearch:
    """Test user search for sharing autocomplete."""

    async def test_search_users_by_prefix(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """Can search users by username prefix."""
        response = await authenticated_client.get("/api/v1/auth/users?prefix=other")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["username"] == "otheruser"

    async def test_search_users_no_results(self, authenticated_client: AsyncClient):
        """Returns empty list when no users match."""
        response = await authenticated_client.get("/api/v1/auth/users?prefix=nobody")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0

    async def test_search_users_excludes_self(
        self,
        authenticated_client: AsyncClient,
    ):
        """Search results exclude the current user."""
        response = await authenticated_client.get("/api/v1/auth/users?prefix=test")
        assert response.status_code == 200
        data = response.json()
        # testuser should not appear in results
        usernames = [u["username"] for u in data]
        assert "testuser" not in usernames

    async def test_search_users_case_insensitive(
        self,
        authenticated_client: AsyncClient,
        other_user,
    ):
        """Search is case insensitive."""
        response = await authenticated_client.get("/api/v1/auth/users?prefix=OTHER")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["username"] == "otheruser"

    async def test_search_users_requires_auth(self, client: AsyncClient):
        """User search requires authentication."""
        response = await client.get("/api/v1/auth/users?prefix=test")
        assert response.status_code == 401

    async def test_search_users_minimum_prefix(self, authenticated_client: AsyncClient):
        """Prefix must be at least 1 character."""
        response = await authenticated_client.get("/api/v1/auth/users?prefix=")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 0
