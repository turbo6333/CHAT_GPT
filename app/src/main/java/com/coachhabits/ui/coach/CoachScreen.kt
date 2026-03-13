package com.coachhabits.ui.coach

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.coachhabits.R

/** Interface chat du coach IA. */
@Composable
fun CoachScreen(viewModel: CoachViewModel = hiltViewModel()) {
    val state = viewModel.uiState.collectAsState().value
    Column(modifier = Modifier.padding(16.dp)) {
        Button(onClick = { viewModel.askCoach("Alex", "Sport fait", 4, 5) }) {
            Text(stringResource(R.string.ask_coach))
        }
        if (state.loading) CircularProgressIndicator(modifier = Modifier.padding(top = 12.dp))
        LazyColumn(modifier = Modifier.padding(top = 12.dp)) {
            items(state.messages) { Text(it) }
        }
    }
}
