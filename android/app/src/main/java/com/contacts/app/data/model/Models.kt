package com.contacts.app.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class PersonListItem(
    val id: Int,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @SerialName("display_name") val displayName: String,
    @SerialName("birth_date") val birthDate: String? = null,
    @SerialName("anniversary_date") val anniversaryDate: String? = null,
    val relation: String? = null
)

@Serializable
data class PersonDetail(
    val id: Int,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("middle_initial") val middleInitial: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @SerialName("birth_date") val birthDate: String? = null,
    @SerialName("anniversary_date") val anniversaryDate: String? = null,
    val relation: String? = null,
    val title: String? = null,
    @SerialName("married_to") val marriedTo: String? = null,
    @SerialName("decease_date") val deceaseDate: String? = null,
    @SerialName("full_name") val fullName: String,
    @SerialName("display_name") val displayName: String,
    val addresses: List<Address> = emptyList(),
    val communications: List<Communication> = emptyList(),
    val attributes: List<Attribute> = emptyList()
)

@Serializable
data class Address(
    val id: Int,
    @SerialName("person_id") val personId: Int,
    val address1: String? = null,
    val address2: String? = null,
    val city: String? = null,
    val state: String? = null,
    @SerialName("zip_code") val zipCode: String? = null,
    @SerialName("address_type") val addressType: String? = null,
    @SerialName("full_address") val fullAddress: String
)

@Serializable
data class Communication(
    val id: Int,
    @SerialName("person_id") val personId: Int,
    @SerialName("comm_type") val commType: String? = null,
    val detail: String? = null
)

@Serializable
data class Attribute(
    val id: Int,
    @SerialName("person_id") val personId: Int,
    @SerialName("attrib_type") val attribType: String? = null,
    val detail: String? = null
)

@Serializable
data class UpcomingEvent(
    @SerialName("person_id") val personId: Int,
    val name: String,
    @SerialName("event_type") val eventType: String,
    val date: String,
    @SerialName("original_year") val originalYear: Int? = null,
    @SerialName("days_until") val daysUntil: Int
)

object RelationLabels {
    val labels = mapOf(
        "FAM" to "Family",
        "FRD" to "Friend",
        "ASC" to "Associate",
        "BUS" to "Business"
    )
}

object CommTypeLabels {
    val labels = mapOf(
        "H" to "Home",
        "W" to "Work",
        "C" to "Cell",
        "E" to "Email",
        "F" to "Fax",
        "P" to "Pager"
    )
}

object AddressTypeLabels {
    val labels = mapOf(
        "H" to "Home",
        "W" to "Work",
        "O" to "Other"
    )
}
