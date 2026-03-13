package com.coachhabits.domain.usecase

import com.coachhabits.data.repository.HabitRepository
import com.coachhabits.domain.model.DailyLog
import javax.inject.Inject

/** Cas d'usage pour enregistrer un check-in. */
class LogHabitUseCase @Inject constructor(
    private val repository: HabitRepository
) {
    /** Exécute l'enregistrement du check-in. */
    suspend operator fun invoke(log: DailyLog, currentStreak: Int) {
        repository.logHabit(log, currentStreak)
    }
}
