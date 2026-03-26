package com.coachhabits.ui.habits

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.coachhabits.R

/** Détails d'une habitude. */
@Composable
fun HabitDetailScreen(streak: Int) {
    Column(modifier = Modifier.padding(16.dp)) {
        Text(text = stringResource(R.string.current_streak, streak))
    }
}
