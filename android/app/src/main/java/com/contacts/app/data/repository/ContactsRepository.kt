package com.contacts.app.data.repository

import com.contacts.app.data.api.ContactsApi
import com.contacts.app.data.model.PersonDetail
import com.contacts.app.data.model.PersonListItem
import com.contacts.app.data.model.UpcomingEvent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ContactsRepository @Inject constructor(
    private val api: ContactsApi
) {
    suspend fun getPersons(
        search: String? = null,
        relation: String? = null
    ): Result<List<PersonListItem>> = withContext(Dispatchers.IO) {
        runCatching {
            api.getPersons(search, relation)
        }
    }

    suspend fun getPerson(id: Int): Result<PersonDetail> = withContext(Dispatchers.IO) {
        runCatching {
            api.getPerson(id)
        }
    }

    suspend fun getUpcomingEvents(days: Int = 30): Result<List<UpcomingEvent>> = withContext(Dispatchers.IO) {
        runCatching {
            api.getUpcomingEvents(days)
        }
    }
}
