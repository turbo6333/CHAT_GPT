package com.coachhabits.ui.mood

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.coachhabits.R

/** Écran de check-in humeur quotidien. */
@Composable
fun MoodCheckInScreen(viewModel: MoodViewModel) {
    val mood = viewModel.mood.collectAsState().value
    Column(modifier = Modifier.padding(16.dp)) {
        Text(stringResource(R.string.mood_title, mood))
        Row {
            (1..5).forEach { value ->
                FilterChip(
                    selected = mood == value,
                    onClick = { viewModel.setMood(value) },
                    label = { Text(value.toString()) },
                    modifier = Modifier.padding(end = 8.dp)
                )
            }
        }
    }
}
