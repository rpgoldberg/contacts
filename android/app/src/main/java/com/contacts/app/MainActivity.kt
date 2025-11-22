package com.contacts.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.People
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.contacts.app.ui.screens.ContactDetailScreen
import com.contacts.app.ui.screens.ContactsListScreen
import com.contacts.app.ui.screens.UpcomingScreen
import com.contacts.app.ui.theme.ContactsTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            ContactsTheme {
                ContactsNavHost()
            }
        }
    }
}

sealed class Screen(val route: String, val title: String) {
    data object Contacts : Screen("contacts", "Contacts")
    data object Upcoming : Screen("upcoming", "Upcoming")
    data object ContactDetail : Screen("contact/{id}", "Contact") {
        fun createRoute(id: Int) = "contact/$id"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactsNavHost() {
    val navController = rememberNavController()
    val currentBackStack by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStack?.destination?.route

    val bottomNavItems = listOf(
        Screen.Contacts to Icons.Default.People,
        Screen.Upcoming to Icons.Default.CalendarMonth
    )

    Scaffold(
        bottomBar = {
            if (currentRoute in listOf(Screen.Contacts.route, Screen.Upcoming.route)) {
                NavigationBar {
                    bottomNavItems.forEach { (screen, icon) ->
                        NavigationBarItem(
                            selected = currentRoute == screen.route,
                            onClick = {
                                if (currentRoute != screen.route) {
                                    navController.navigate(screen.route) {
                                        popUpTo(Screen.Contacts.route) { saveState = true }
                                        launchSingleTop = true
                                        restoreState = true
                                    }
                                }
                            },
                            icon = { Icon(icon, contentDescription = screen.title) },
                            label = { Text(screen.title) }
                        )
                    }
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Screen.Contacts.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(Screen.Contacts.route) {
                ContactsListScreen(
                    onContactClick = { id ->
                        navController.navigate(Screen.ContactDetail.createRoute(id))
                    }
                )
            }

            composable(Screen.Upcoming.route) {
                UpcomingScreen(
                    onEventClick = { id ->
                        navController.navigate(Screen.ContactDetail.createRoute(id))
                    }
                )
            }

            composable(
                route = Screen.ContactDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.IntType })
            ) { backStackEntry ->
                val personId = backStackEntry.arguments?.getInt("id") ?: return@composable
                ContactDetailScreen(
                    personId = personId,
                    onBackClick = { navController.popBackStack() }
                )
            }
        }
    }
}
