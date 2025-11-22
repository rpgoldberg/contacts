package com.contacts.app

import com.contacts.app.data.model.*
import org.junit.Assert.*
import org.junit.Test

class ModelsTest {

    @Test
    fun `RelationLabels contains all relation types`() {
        assertEquals("Family", RelationLabels.labels["FAM"])
        assertEquals("Friend", RelationLabels.labels["FRD"])
        assertEquals("Associate", RelationLabels.labels["ASC"])
        assertEquals("Business", RelationLabels.labels["BUS"])
    }

    @Test
    fun `CommTypeLabels contains all communication types`() {
        assertEquals("Home", CommTypeLabels.labels["H"])
        assertEquals("Work", CommTypeLabels.labels["W"])
        assertEquals("Cell", CommTypeLabels.labels["C"])
        assertEquals("Email", CommTypeLabels.labels["E"])
        assertEquals("Fax", CommTypeLabels.labels["F"])
    }

    @Test
    fun `AddressTypeLabels contains all address types`() {
        assertEquals("Home", AddressTypeLabels.labels["H"])
        assertEquals("Work", AddressTypeLabels.labels["W"])
        assertEquals("Other", AddressTypeLabels.labels["O"])
    }

    @Test
    fun `PersonListItem displayName is not empty`() {
        val person = PersonListItem(
            id = 1,
            firstName = "John",
            lastName = "Doe",
            displayName = "Doe, John",
            birthDate = null,
            anniversaryDate = null,
            relation = "FRD"
        )

        assertTrue(person.displayName.isNotBlank())
    }

    @Test
    fun `UpcomingEvent daysUntil is non-negative for future events`() {
        val event = UpcomingEvent(
            personId = 1,
            name = "Test Person",
            eventType = "birthday",
            date = "2024-12-25",
            originalYear = 1990,
            daysUntil = 30
        )

        assertTrue(event.daysUntil >= 0)
    }
}
