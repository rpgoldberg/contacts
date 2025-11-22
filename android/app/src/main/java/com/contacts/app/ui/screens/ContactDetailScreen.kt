package com.contacts.app.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.contacts.app.data.model.*
import com.contacts.app.ui.theme.*
import com.contacts.app.ui.viewmodels.ContactDetailViewModel
import java.time.LocalDate
import java.time.Period
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactDetailScreen(
    personId: Int,
    onBackClick: () -> Unit,
    viewModel: ContactDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(personId) {
        viewModel.loadPerson(personId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            uiState.error != null -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Failed to load contact", color = MaterialTheme.colorScheme.error)
                }
            }
            uiState.person != null -> {
                val person = uiState.person!!
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Header
                    item {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(200.dp)
                                .background(
                                    brush = Brush.horizontalGradient(
                                        colors = listOf(Primary, PrimaryLight)
                                    )
                                )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxSize()
                                    .padding(24.dp),
                                verticalArrangement = Arrangement.Center
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Box(
                                        modifier = Modifier
                                            .size(80.dp)
                                            .clip(CircleShape)
                                            .background(SurfaceLight.copy(alpha = 0.2f)),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Icon(
                                            Icons.Default.Person,
                                            contentDescription = null,
                                            modifier = Modifier.size(40.dp),
                                            tint = SurfaceLight
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(16.dp))
                                    Column {
                                        Text(
                                            text = person.displayName,
                                            style = MaterialTheme.typography.headlineMedium,
                                            color = SurfaceLight
                                        )
                                        person.relation?.let { relation ->
                                            Surface(
                                                modifier = Modifier.padding(top = 8.dp),
                                                shape = RoundedCornerShape(16.dp),
                                                color = SurfaceLight.copy(alpha = 0.2f)
                                            ) {
                                                Text(
                                                    text = RelationLabels.labels[relation] ?: relation,
                                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                                                    style = MaterialTheme.typography.labelMedium,
                                                    color = SurfaceLight
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    // Info cards
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            shape = RoundedCornerShape(16.dp)
                        ) {
                            Column(modifier = Modifier.padding(16.dp)) {
                                person.birthDate?.let { dateStr ->
                                    val age = calculateAge(dateStr)
                                    InfoRow(
                                        icon = Icons.Default.Cake,
                                        iconTint = BirthdayColor,
                                        label = "Birthday",
                                        value = formatDate(dateStr) + (age?.let { " ($it years old)" } ?: "")
                                    )
                                }
                                person.anniversaryDate?.let { dateStr ->
                                    val years = calculateAge(dateStr)
                                    InfoRow(
                                        icon = Icons.Default.Favorite,
                                        iconTint = AnniversaryColor,
                                        label = "Anniversary",
                                        value = formatDate(dateStr) + (years?.let { " ($it years)" } ?: "")
                                    )
                                }
                                person.marriedTo?.let { spouse ->
                                    InfoRow(
                                        icon = Icons.Default.People,
                                        iconTint = FamilyColor,
                                        label = "Married To",
                                        value = spouse
                                    )
                                }
                                person.title?.let { title ->
                                    InfoRow(
                                        icon = Icons.Default.Work,
                                        iconTint = BusinessColor,
                                        label = "Title",
                                        value = title
                                    )
                                }
                            }
                        }
                    }

                    // Communications
                    if (person.communications.isNotEmpty()) {
                        item {
                            SectionHeader(icon = Icons.Default.Phone, title = "Contact Info")
                        }
                        items(person.communications) { comm ->
                            CommunicationItem(
                                comm = comm,
                                onClick = {
                                    when (comm.commType) {
                                        "E" -> {
                                            comm.detail?.let { email ->
                                                val intent = Intent(Intent.ACTION_SENDTO).apply {
                                                    data = Uri.parse("mailto:$email")
                                                }
                                                context.startActivity(intent)
                                            }
                                        }
                                        "H", "W", "C" -> {
                                            comm.detail?.let { phone ->
                                                val intent = Intent(Intent.ACTION_DIAL).apply {
                                                    data = Uri.parse("tel:${phone.filter { it.isDigit() }}")
                                                }
                                                context.startActivity(intent)
                                            }
                                        }
                                    }
                                }
                            )
                        }
                    }

                    // Addresses
                    if (person.addresses.isNotEmpty()) {
                        item {
                            SectionHeader(icon = Icons.Default.LocationOn, title = "Addresses")
                        }
                        items(person.addresses) { address ->
                            AddressItem(address = address)
                        }
                    }

                    // Attributes
                    if (person.attributes.isNotEmpty()) {
                        item {
                            SectionHeader(icon = Icons.Default.Info, title = "Additional Info")
                        }
                        items(person.attributes) { attribute ->
                            AttributeItem(attribute = attribute)
                        }
                    }

                    item { Spacer(modifier = Modifier.height(32.dp)) }
                }
            }
        }
    }
}

@Composable
private fun InfoRow(
    icon: ImageVector,
    iconTint: androidx.compose.ui.graphics.Color,
    label: String,
    value: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(24.dp),
            tint = iconTint
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.bodyLarge
            )
        }
    }
}

@Composable
private fun SectionHeader(icon: ImageVector, title: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

@Composable
private fun CommunicationItem(comm: Communication, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                if (comm.commType == "E") Icons.Default.Email else Icons.Default.Phone,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = CommTypeLabels.labels[comm.commType] ?: comm.commType ?: "Other",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = comm.detail ?: "-",
                    style = MaterialTheme.typography.bodyLarge
                )
            }
            if (comm.commType in listOf("H", "W", "C", "E") && !comm.detail.isNullOrBlank()) {
                Text(
                    text = if (comm.commType == "E") "Email" else "Call",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun AddressItem(address: Address) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = AddressTypeLabels.labels[address.addressType] ?: address.addressType ?: "Address",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = address.fullAddress.ifBlank { "No address details" },
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@Composable
private fun AttributeItem(attribute: Attribute) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = attribute.attribType ?: "Info",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = attribute.detail ?: "-",
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

private fun formatDate(dateStr: String): String {
    return try {
        val date = LocalDate.parse(dateStr)
        date.format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))
    } catch (e: Exception) {
        dateStr
    }
}

private fun calculateAge(dateStr: String): Int? {
    return try {
        val date = LocalDate.parse(dateStr)
        if (date.year > 2100) return null
        Period.between(date, LocalDate.now()).years
    } catch (e: Exception) {
        null
    }
}
