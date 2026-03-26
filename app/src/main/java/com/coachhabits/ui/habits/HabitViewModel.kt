package com.coachhabits.ui.habits

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coachhabits.data.repository.HabitRepository
import com.coachhabits.domain.model.Habit
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.launch

/** ViewModel des actions sur les habitudes. */
@HiltViewModel
class HabitViewModel @Inject constructor(
    private val repository: HabitRepository
) : ViewModel() {
    /** Crée une habitude. */
    fun addHabit(name: String, category: String, reminderTime: String) {
        viewModelScope.launch {
            repository.createHabit(Habit(name = name, category = category, reminderTime = reminderTime))
        }
    }
}
