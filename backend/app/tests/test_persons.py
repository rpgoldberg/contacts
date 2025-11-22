from httpx import AsyncClient
from datetime import date


class TestPersonsAPI:
    """Test suite for Persons API endpoints."""

    async def test_create_person(self, authenticated_client: AsyncClient):
        """Test creating a new person."""
        person_data = {
            "first_name": "John",
            "middle_initial": "D",
            "last_name": "Doe",
            "birth_date": "1990-05-15",
            "relation": "FRD",
        }
        response = await authenticated_client.post("/api/v1/persons/", json=person_data)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
        assert data["display_name"] == "Doe, John D"
        assert data["id"] is not None

    async def test_get_person(self, authenticated_client: AsyncClient):
        """Test getting a person by ID."""
        # First create a person
        person_data = {"first_name": "Jane", "last_name": "Smith"}
        create_response = await authenticated_client.post("/api/v1/persons/", json=person_data)
        person_id = create_response.json()["id"]

        # Get the person
        response = await authenticated_client.get(f"/api/v1/persons/{person_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Smith"
        assert data["addresses"] == []
        assert data["communications"] == []

    async def test_get_person_not_found(self, authenticated_client: AsyncClient):
        """Test getting a non-existent person."""
        response = await authenticated_client.get("/api/v1/persons/99999")
        assert response.status_code == 404

    async def test_list_persons(self, authenticated_client: AsyncClient):
        """Test listing all persons."""
        # Create multiple persons
        await authenticated_client.post("/api/v1/persons/", json={"first_name": "Alice", "last_name": "Wonder"})
        await authenticated_client.post("/api/v1/persons/", json={"first_name": "Bob", "last_name": "Builder"})

        response = await authenticated_client.get("/api/v1/persons/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_search_persons(self, authenticated_client: AsyncClient):
        """Test searching persons by name."""
        await authenticated_client.post("/api/v1/persons/", json={"first_name": "Charlie", "last_name": "Brown"})
        await authenticated_client.post("/api/v1/persons/", json={"first_name": "Diana", "last_name": "Prince"})

        # Search by first name
        response = await authenticated_client.get("/api/v1/persons/?search=Charlie")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Charlie"

        # Search by last name
        response = await authenticated_client.get("/api/v1/persons/?search=Prince")
        data = response.json()
        assert len(data) == 1
        assert data[0]["last_name"] == "Prince"

    async def test_filter_by_relation(self, authenticated_client: AsyncClient):
        """Test filtering persons by relation type."""
        await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Family", "last_name": "Member", "relation": "FAM"}
        )
        await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Work", "last_name": "Friend", "relation": "FRD"}
        )

        response = await authenticated_client.get("/api/v1/persons/?relation=FAM")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Family"

    async def test_update_person(self, authenticated_client: AsyncClient):
        """Test updating a person."""
        # Create a person
        create_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Old", "last_name": "Name"}
        )
        person_id = create_response.json()["id"]

        # Update the person
        response = await authenticated_client.put(
            f"/api/v1/persons/{person_id}", json={"first_name": "New", "title": "Manager"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "New"
        assert data["title"] == "Manager"
        assert data["last_name"] == "Name"  # Unchanged

    async def test_delete_person(self, authenticated_client: AsyncClient):
        """Test deleting a person."""
        # Create a person
        create_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "To", "last_name": "Delete"}
        )
        person_id = create_response.json()["id"]

        # Delete the person
        response = await authenticated_client.delete(f"/api/v1/persons/{person_id}")
        assert response.status_code == 204

        # Verify deletion
        get_response = await authenticated_client.get(f"/api/v1/persons/{person_id}")
        assert get_response.status_code == 404


class TestAddressesAPI:
    """Test suite for Addresses API endpoints."""

    async def test_create_address(self, authenticated_client: AsyncClient):
        """Test creating a new address."""
        # First create a person
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        # Create address
        address_data = {
            "person_id": person_id,
            "address1": "123 Main St",
            "city": "Springfield",
            "state": "IL",
            "zip_code": "62701",
            "address_type": "H",
        }
        response = await authenticated_client.post("/api/v1/addresses/", json=address_data)
        assert response.status_code == 201
        data = response.json()
        assert data["address1"] == "123 Main St"
        assert data["city"] == "Springfield"

    async def test_address_appears_in_person_detail(self, authenticated_client: AsyncClient):
        """Test that addresses appear in person detail response."""
        # Create person
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        # Create address
        await authenticated_client.post(
            "/api/v1/addresses/",
            json={"person_id": person_id, "address1": "456 Oak Ave", "address_type": "W"},
        )

        # Get person detail
        response = await authenticated_client.get(f"/api/v1/persons/{person_id}")
        data = response.json()
        assert len(data["addresses"]) == 1
        assert data["addresses"][0]["address1"] == "456 Oak Ave"

    async def test_get_address(self, authenticated_client: AsyncClient):
        """Test getting an address by ID."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/addresses/",
            json={"person_id": person_id, "address1": "789 Pine Rd", "address_type": "H"},
        )
        address_id = create_response.json()["id"]

        response = await authenticated_client.get(f"/api/v1/addresses/{address_id}")
        assert response.status_code == 200
        assert response.json()["address1"] == "789 Pine Rd"

    async def test_update_address(self, authenticated_client: AsyncClient):
        """Test updating an address."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/addresses/",
            json={"person_id": person_id, "address1": "Old Address", "address_type": "H"},
        )
        address_id = create_response.json()["id"]

        response = await authenticated_client.put(
            f"/api/v1/addresses/{address_id}", json={"address1": "New Address"}
        )
        assert response.status_code == 200
        assert response.json()["address1"] == "New Address"

    async def test_delete_address(self, authenticated_client: AsyncClient):
        """Test deleting an address."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/addresses/",
            json={"person_id": person_id, "address1": "To Delete", "address_type": "H"},
        )
        address_id = create_response.json()["id"]

        response = await authenticated_client.delete(f"/api/v1/addresses/{address_id}")
        assert response.status_code == 204


class TestCommunicationsAPI:
    """Test suite for Communications API endpoints."""

    async def test_create_communication(self, authenticated_client: AsyncClient):
        """Test creating a new communication."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        comm_data = {"person_id": person_id, "comm_type": "H", "detail": "555-1234"}
        response = await authenticated_client.post("/api/v1/communications/", json=comm_data)
        assert response.status_code == 201
        data = response.json()
        assert data["comm_type"] == "H"
        assert data["detail"] == "555-1234"

    async def test_get_communication(self, authenticated_client: AsyncClient):
        """Test getting a communication by ID."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/communications/",
            json={"person_id": person_id, "comm_type": "E", "detail": "test@email.com"},
        )
        comm_id = create_response.json()["id"]

        response = await authenticated_client.get(f"/api/v1/communications/{comm_id}")
        assert response.status_code == 200
        assert response.json()["detail"] == "test@email.com"

    async def test_update_communication(self, authenticated_client: AsyncClient):
        """Test updating a communication."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/communications/",
            json={"person_id": person_id, "comm_type": "C", "detail": "555-0000"},
        )
        comm_id = create_response.json()["id"]

        response = await authenticated_client.put(
            f"/api/v1/communications/{comm_id}", json={"detail": "555-9999"}
        )
        assert response.status_code == 200
        assert response.json()["detail"] == "555-9999"

    async def test_delete_communication(self, authenticated_client: AsyncClient):
        """Test deleting a communication."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/communications/",
            json={"person_id": person_id, "comm_type": "F", "detail": "555-FAX"},
        )
        comm_id = create_response.json()["id"]

        response = await authenticated_client.delete(f"/api/v1/communications/{comm_id}")
        assert response.status_code == 204


class TestUpcomingAPI:
    """Test suite for Upcoming events API endpoints."""

    async def test_upcoming_birthdays(self, authenticated_client: AsyncClient):
        """Test getting upcoming birthdays."""
        from datetime import timedelta

        # Create person with birthday in 5 days
        future_date = date.today() + timedelta(days=5)
        await authenticated_client.post(
            "/api/v1/persons/",
            json={
                "first_name": "Birthday",
                "last_name": "Person",
                "birth_date": f"1990-{future_date.month:02d}-{future_date.day:02d}",
            },
        )

        response = await authenticated_client.get("/api/v1/upcoming/birthdays?days=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(p["name"] == "Person, Birthday" for p in data)

    async def test_upcoming_all(self, authenticated_client: AsyncClient):
        """Test getting all upcoming events."""
        response = await authenticated_client.get("/api/v1/upcoming/all?days=30")
        assert response.status_code == 200

    async def test_upcoming_anniversaries(self, authenticated_client: AsyncClient):
        """Test getting upcoming anniversaries."""
        from datetime import timedelta

        future_date = date.today() + timedelta(days=7)
        await authenticated_client.post(
            "/api/v1/persons/",
            json={
                "first_name": "Anniversary",
                "last_name": "Person",
                "anniversary_date": f"2010-{future_date.month:02d}-{future_date.day:02d}",
            },
        )

        response = await authenticated_client.get("/api/v1/upcoming/anniversaries?days=14")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1


class TestAttributesAPI:
    """Test suite for Attributes API endpoints."""

    async def test_create_attribute(self, authenticated_client: AsyncClient):
        """Test creating an attribute."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        response = await authenticated_client.post(
            "/api/v1/attributes/",
            json={"person_id": person_id, "attrib_type": "hobby", "detail": "Golf"},
        )
        assert response.status_code == 201
        assert response.json()["detail"] == "Golf"

    async def test_get_attribute(self, authenticated_client: AsyncClient):
        """Test getting an attribute."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/attributes/",
            json={"person_id": person_id, "attrib_type": "note", "detail": "Important"},
        )
        attr_id = create_response.json()["id"]

        response = await authenticated_client.get(f"/api/v1/attributes/{attr_id}")
        assert response.status_code == 200
        assert response.json()["detail"] == "Important"

    async def test_update_attribute(self, authenticated_client: AsyncClient):
        """Test updating an attribute."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/attributes/",
            json={"person_id": person_id, "attrib_type": "note", "detail": "Old Value"},
        )
        attr_id = create_response.json()["id"]

        response = await authenticated_client.put(
            f"/api/v1/attributes/{attr_id}", json={"detail": "New Value"}
        )
        assert response.status_code == 200
        assert response.json()["detail"] == "New Value"

    async def test_delete_attribute(self, authenticated_client: AsyncClient):
        """Test deleting an attribute."""
        person_response = await authenticated_client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        create_response = await authenticated_client.post(
            "/api/v1/attributes/",
            json={"person_id": person_id, "attrib_type": "note", "detail": "To Delete"},
        )
        attr_id = create_response.json()["id"]

        response = await authenticated_client.delete(f"/api/v1/attributes/{attr_id}")
        assert response.status_code == 204
