package com.coachhabits.ui.habits

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.coachhabits.R

/** Formulaire de création d'habitude. */
@Composable
fun AddHabitScreen(viewModel: HabitViewModel = hiltViewModel()) {
    var name by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var reminder by remember { mutableStateOf("") }
    Column(modifier = Modifier.padding(16.dp)) {
        OutlinedTextField(name, { name = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.habit_name)) })
        OutlinedTextField(category, { category = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.habit_category)) })
        OutlinedTextField(reminder, { reminder = it }, Modifier.fillMaxWidth(), label = { Text(stringResource(R.string.habit_reminder)) })
        Button(onClick = { viewModel.addHabit(name, category, reminder) }, modifier = Modifier.padding(top = 12.dp)) {
            Text(stringResource(R.string.add_habit))
        }
    }
}
