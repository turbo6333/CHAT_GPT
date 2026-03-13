package com.coachhabits.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

/** Écran principal avec progression du jour. */
@Composable
fun DashboardScreen(viewModel: DashboardViewModel = hiltViewModel()) {
    val state = viewModel.uiState.collectAsState().value
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(16.dp)) {
        items(state.habits) { habit ->
            Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(16.dp)) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(habit.name, style = MaterialTheme.typography.titleMedium)
                    Text(habit.category, style = MaterialTheme.typography.bodySmall)
                    LinearProgressIndicator(progress = { (habit.streak % 7) / 7f }, modifier = Modifier.fillMaxWidth())
                }
            }
        }
    }
}
