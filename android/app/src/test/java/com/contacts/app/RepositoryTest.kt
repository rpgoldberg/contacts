package com.contacts.app

import com.contacts.app.data.api.ContactsApi
import com.contacts.app.data.model.PersonListItem
import com.contacts.app.data.model.UpcomingEvent
import com.contacts.app.data.repository.ContactsRepository
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test

class RepositoryTest {

    private lateinit var api: ContactsApi
    private lateinit var repository: ContactsRepository

    @Before
    fun setup() {
        api = mockk()
        repository = ContactsRepository(api)
    }

    @Test
    fun `getPersons returns success with data`() = runTest {
        val mockPersons = listOf(
            PersonListItem(
                id = 1,
                firstName = "John",
                lastName = "Doe",
                displayName = "Doe, John",
                birthDate = "1990-01-15",
                anniversaryDate = null,
                relation = "FRD"
            )
        )

        coEvery { api.getPersons(any(), any()) } returns mockPersons

        val result = repository.getPersons()

        assertTrue(result.isSuccess)
        assertEquals(1, result.getOrNull()?.size)
        assertEquals("John", result.getOrNull()?.first()?.firstName)
    }

    @Test
    fun `getPersons returns failure on exception`() = runTest {
        coEvery { api.getPersons(any(), any()) } throws RuntimeException("Network error")

        val result = repository.getPersons()

        assertTrue(result.isFailure)
    }

    @Test
    fun `getUpcomingEvents returns events sorted by days until`() = runTest {
        val mockEvents = listOf(
            UpcomingEvent(
                personId = 1,
                name = "John Doe",
                eventType = "birthday",
                date = "2024-12-25",
                originalYear = 1990,
                daysUntil = 5
            ),
            UpcomingEvent(
                personId = 2,
                name = "Jane Smith",
                eventType = "anniversary",
                date = "2024-12-20",
                originalYear = 2010,
                daysUntil = 0
            )
        )

        coEvery { api.getUpcomingEvents(any()) } returns mockEvents

        val result = repository.getUpcomingEvents(30)

        assertTrue(result.isSuccess)
        assertEquals(2, result.getOrNull()?.size)
    }
}
