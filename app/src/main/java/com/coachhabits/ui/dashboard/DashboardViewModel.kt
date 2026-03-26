package com.coachhabits.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coachhabits.domain.model.Habit
import com.coachhabits.domain.usecase.GetHabitsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** État UI du dashboard. */
data class DashboardUiState(val habits: List<Habit> = emptyList())

/** ViewModel du dashboard. */
@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val getHabitsUseCase: GetHabitsUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        observeHabits()
    }

    /** Observe les habitudes à afficher. */
    fun observeHabits() {
        viewModelScope.launch {
            getHabitsUseCase().collect { _uiState.value = DashboardUiState(it) }
        }
    }
}
