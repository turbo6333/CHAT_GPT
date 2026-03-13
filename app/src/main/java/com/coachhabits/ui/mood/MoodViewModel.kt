package com.coachhabits.ui.mood

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/** ViewModel du check-in humeur. */
@HiltViewModel
class MoodViewModel @Inject constructor() : ViewModel() {
    private val _mood = MutableStateFlow(3)
    val mood: StateFlow<Int> = _mood.asStateFlow()

    /** Met à jour la note d'humeur entre 1 et 5. */
    fun setMood(value: Int) {
        _mood.value = value.coerceIn(1, 5)
    }
}
