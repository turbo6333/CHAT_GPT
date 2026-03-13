package com.coachhabits

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.res.stringResource
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.coachhabits.ui.coach.CoachScreen
import com.coachhabits.ui.dashboard.DashboardScreen
import com.coachhabits.ui.habits.AddHabitScreen
import com.coachhabits.ui.mood.MoodCheckInScreen
import com.coachhabits.ui.mood.MoodViewModel
import com.coachhabits.ui.profile.ProfileScreen
import com.coachhabits.ui.theme.CoachHabitsTheme
import dagger.hilt.android.AndroidEntryPoint

/** Activité principale de l'application. */
@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    /** Point d'entrée Android. */
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent { CoachHabitsTheme { AppRoot() } }
    }
}

private data class NavItem(val route: String, val labelRes: Int)

/** Navigation principale de l'application. */
@Composable
fun AppRoot() {
    val navController = rememberNavController()
    val moodViewModel: MoodViewModel = hiltViewModel()
    val items = listOf(
        NavItem("dashboard", R.string.dashboard),
        NavItem("habits", R.string.habits),
        NavItem("coach", R.string.coach),
        NavItem("profil", R.string.profile)
    )
    Scaffold(bottomBar = {
        NavigationBar {
            val currentDestination = navController.currentBackStackEntryAsState().value?.destination
            items.forEach { item ->
                NavigationBarItem(
                    selected = currentDestination?.hierarchy?.any { it.route == item.route } == true,
                    onClick = {
                        navController.navigate(item.route) {
                            popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    icon = { Icon(androidx.compose.material.icons.Icons.Default.Home, contentDescription = null) },
                    label = { Text(stringResource(item.labelRes)) }
                )
            }
        }
    }) { padding ->
        NavHost(navController = navController, startDestination = "dashboard", modifier = androidx.compose.ui.Modifier.padding(padding)) {
            composable("dashboard") { DashboardScreen() }
            composable("habits") { AddHabitScreen() }
            composable("coach") { CoachScreen() }
            composable("profil") { ProfileScreen() }
            composable("mood") { MoodCheckInScreen(moodViewModel) }
        }
    }
}
