package com.coachhabits.data.remote

import com.squareup.moshi.Json

/** Requête OpenAI chat completions. */
data class ChatRequest(
    @Json(name = "model") val model: String = "gpt-4o-mini",
    @Json(name = "messages") val messages: List<Message>
)

/** Message de conversation. */
data class Message(
    @Json(name = "role") val role: String,
    @Json(name = "content") val content: String
)

/** Réponse OpenAI chat completions. */
data class ChatResponse(
    @Json(name = "choices") val choices: List<Choice>
)

/** Choix de la réponse modèle. */
data class Choice(
    @Json(name = "message") val message: Message
)
