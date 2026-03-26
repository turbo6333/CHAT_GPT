package com.coachhabits.ui.coach

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.coachhabits.data.repository.Result
import com.coachhabits.domain.usecase.GetAIInsightUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/** État UI du coach IA. */
data class CoachUiState(val messages: List<String> = emptyList(), val loading: Boolean = false)

/** ViewModel du coach IA. */
@HiltViewModel
class CoachViewModel @Inject constructor(
    private val getAIInsightUseCase: GetAIInsightUseCase
) : ViewModel() {
    private val _uiState = MutableStateFlow(CoachUiState())
    val uiState: StateFlow<CoachUiState> = _uiState.asStateFlow()

    /** Demande un insight court en français. */
    fun askCoach(name: String, habitData: String, mood: Int, streak: Int) {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(loading = true)
            val message = when (val result = getAIInsightUseCase(name, habitData, mood, streak)) {
                is Result.Success -> result.data
                is Result.Error -> result.message
            }
            _uiState.value = CoachUiState(messages = _uiState.value.messages + message, loading = false)
        }
    }
}
