import pytest
from httpx import AsyncClient
from datetime import date


class TestPersonsAPI:
    """Test suite for Persons API endpoints."""

    async def test_create_person(self, client: AsyncClient):
        """Test creating a new person."""
        person_data = {
            "first_name": "John",
            "middle_initial": "D",
            "last_name": "Doe",
            "birth_date": "1990-05-15",
            "relation": "FRD",
        }
        response = await client.post("/api/v1/persons/", json=person_data)
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
        assert data["display_name"] == "Doe, John D"
        assert data["id"] is not None

    async def test_get_person(self, client: AsyncClient):
        """Test getting a person by ID."""
        # First create a person
        person_data = {"first_name": "Jane", "last_name": "Smith"}
        create_response = await client.post("/api/v1/persons/", json=person_data)
        person_id = create_response.json()["id"]

        # Get the person
        response = await client.get(f"/api/v1/persons/{person_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Smith"
        assert data["addresses"] == []
        assert data["communications"] == []

    async def test_get_person_not_found(self, client: AsyncClient):
        """Test getting a non-existent person."""
        response = await client.get("/api/v1/persons/99999")
        assert response.status_code == 404

    async def test_list_persons(self, client: AsyncClient):
        """Test listing all persons."""
        # Create multiple persons
        await client.post("/api/v1/persons/", json={"first_name": "Alice", "last_name": "Wonder"})
        await client.post("/api/v1/persons/", json={"first_name": "Bob", "last_name": "Builder"})

        response = await client.get("/api/v1/persons/")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    async def test_search_persons(self, client: AsyncClient):
        """Test searching persons by name."""
        await client.post("/api/v1/persons/", json={"first_name": "Charlie", "last_name": "Brown"})
        await client.post("/api/v1/persons/", json={"first_name": "Diana", "last_name": "Prince"})

        # Search by first name
        response = await client.get("/api/v1/persons/?search=Charlie")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Charlie"

        # Search by last name
        response = await client.get("/api/v1/persons/?search=Prince")
        data = response.json()
        assert len(data) == 1
        assert data[0]["last_name"] == "Prince"

    async def test_filter_by_relation(self, client: AsyncClient):
        """Test filtering persons by relation type."""
        await client.post(
            "/api/v1/persons/", json={"first_name": "Family", "last_name": "Member", "relation": "FAM"}
        )
        await client.post(
            "/api/v1/persons/", json={"first_name": "Work", "last_name": "Friend", "relation": "FRD"}
        )

        response = await client.get("/api/v1/persons/?relation=FAM")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["first_name"] == "Family"

    async def test_update_person(self, client: AsyncClient):
        """Test updating a person."""
        # Create a person
        create_response = await client.post(
            "/api/v1/persons/", json={"first_name": "Old", "last_name": "Name"}
        )
        person_id = create_response.json()["id"]

        # Update the person
        response = await client.put(
            f"/api/v1/persons/{person_id}", json={"first_name": "New", "title": "Manager"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "New"
        assert data["title"] == "Manager"
        assert data["last_name"] == "Name"  # Unchanged

    async def test_delete_person(self, client: AsyncClient):
        """Test deleting a person."""
        # Create a person
        create_response = await client.post(
            "/api/v1/persons/", json={"first_name": "To", "last_name": "Delete"}
        )
        person_id = create_response.json()["id"]

        # Delete the person
        response = await client.delete(f"/api/v1/persons/{person_id}")
        assert response.status_code == 204

        # Verify deletion
        get_response = await client.get(f"/api/v1/persons/{person_id}")
        assert get_response.status_code == 404


class TestAddressesAPI:
    """Test suite for Addresses API endpoints."""

    async def test_create_address(self, client: AsyncClient):
        """Test creating a new address."""
        # First create a person
        person_response = await client.post(
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
        response = await client.post("/api/v1/addresses/", json=address_data)
        assert response.status_code == 201
        data = response.json()
        assert data["address1"] == "123 Main St"
        assert data["city"] == "Springfield"

    async def test_address_appears_in_person_detail(self, client: AsyncClient):
        """Test that addresses appear in person detail response."""
        # Create person
        person_response = await client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        # Create address
        await client.post(
            "/api/v1/addresses/",
            json={"person_id": person_id, "address1": "456 Oak Ave", "address_type": "W"},
        )

        # Get person detail
        response = await client.get(f"/api/v1/persons/{person_id}")
        data = response.json()
        assert len(data["addresses"]) == 1
        assert data["addresses"][0]["address1"] == "456 Oak Ave"


class TestCommunicationsAPI:
    """Test suite for Communications API endpoints."""

    async def test_create_communication(self, client: AsyncClient):
        """Test creating a new communication."""
        # Create person
        person_response = await client.post(
            "/api/v1/persons/", json={"first_name": "Test", "last_name": "Person"}
        )
        person_id = person_response.json()["id"]

        # Create communication
        comm_data = {
            "person_id": person_id,
            "comm_type": "H",
            "detail": "555-1234",
        }
        response = await client.post("/api/v1/communications/", json=comm_data)
        assert response.status_code == 201
        data = response.json()
        assert data["comm_type"] == "H"
        assert data["detail"] == "555-1234"


class TestUpcomingAPI:
    """Test suite for Upcoming events API endpoints."""

    async def test_upcoming_birthdays(self, client: AsyncClient):
        """Test getting upcoming birthdays."""
        from datetime import date, timedelta

        # Create person with birthday in 5 days
        future_date = date.today() + timedelta(days=5)
        await client.post(
            "/api/v1/persons/",
            json={
                "first_name": "Birthday",
                "last_name": "Person",
                "birth_date": f"1990-{future_date.month:02d}-{future_date.day:02d}",
            },
        )

        response = await client.get("/api/v1/upcoming/birthdays?days=10")
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(p["name"] == "Person, Birthday" for p in data)

    async def test_upcoming_all(self, client: AsyncClient):
        """Test getting all upcoming events."""
        response = await client.get("/api/v1/upcoming/all?days=30")
        assert response.status_code == 200
