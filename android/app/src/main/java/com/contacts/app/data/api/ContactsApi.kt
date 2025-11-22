package com.contacts.app.data.api

import com.contacts.app.data.model.PersonDetail
import com.contacts.app.data.model.PersonListItem
import com.contacts.app.data.model.UpcomingEvent
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface ContactsApi {
    @GET("persons/")
    suspend fun getPersons(
        @Query("search") search: String? = null,
        @Query("relation") relation: String? = null
    ): List<PersonListItem>

    @GET("persons/{id}")
    suspend fun getPerson(@Path("id") id: Int): PersonDetail

    @GET("upcoming/all")
    suspend fun getUpcomingEvents(@Query("days") days: Int = 30): List<UpcomingEvent>

    @GET("upcoming/birthdays")
    suspend fun getUpcomingBirthdays(@Query("days") days: Int = 30): List<UpcomingEvent>

    @GET("upcoming/anniversaries")
    suspend fun getUpcomingAnniversaries(@Query("days") days: Int = 30): List<UpcomingEvent>
}
