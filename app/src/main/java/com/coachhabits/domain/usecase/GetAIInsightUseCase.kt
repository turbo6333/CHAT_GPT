package com.coachhabits.domain.usecase

import com.coachhabits.data.repository.AIRepository
import com.coachhabits.data.repository.Result
import javax.inject.Inject

/** Cas d'usage pour obtenir un conseil IA. */
class GetAIInsightUseCase @Inject constructor(
    private val repository: AIRepository
) {
    /** Exécute la demande d'insight IA. */
    suspend operator fun invoke(name: String, habitData: String, mood: Int, streak: Int): Result<String> {
        return repository.getInsight(name, habitData, mood, streak)
    }
}
