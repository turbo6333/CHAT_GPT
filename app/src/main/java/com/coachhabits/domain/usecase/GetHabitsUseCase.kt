package com.coachhabits.domain.usecase

import com.coachhabits.data.repository.HabitRepository
import com.coachhabits.domain.model.Habit
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/** Cas d'usage pour lire les habitudes. */
class GetHabitsUseCase @Inject constructor(
    private val repository: HabitRepository
) {
    /** Exécute la récupération du flux des habitudes. */
    operator fun invoke(): Flow<List<Habit>> = repository.observeHabits()
}
