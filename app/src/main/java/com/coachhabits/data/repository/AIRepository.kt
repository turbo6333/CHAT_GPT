package com.coachhabits.data.repository

import com.coachhabits.data.remote.ChatRequest
import com.coachhabits.data.remote.Message
import com.coachhabits.data.remote.OpenAIService
import javax.inject.Inject

/** Dépôt pour les insights IA du coach. */
class AIRepository @Inject constructor(
    private val service: OpenAIService
) {
    /** Demande un insight motivant en français. */
    suspend fun getInsight(name: String, habitData: String, mood: Int, streak: Int): Result<String> {
        return runCatching {
            val systemPrompt = """
                Tu es un coach en psychologie des habitudes, bienveillant et direct.
                L'utilisateur s'appelle $name.
                Voici ses habitudes du jour: $habitData.
                Son humeur aujourd'hui: $mood/5.
                Son streak actuel: $streak jours.
                Génère une analyse courte (3 phrases max) en français,
                avec un conseil concret basé sur les principes TCC.
            """.trimIndent()
            val request = ChatRequest(messages = listOf(Message("system", systemPrompt)))
            service.getInsight(request).choices.first().message.content
        }.fold(
            onSuccess = { Result.Success(it) },
            onFailure = { Result.Error(it.message ?: "Erreur réseau") }
        )
    }
}
