package com.coachhabits.data.remote

import retrofit2.http.Body
import retrofit2.http.Headers
import retrofit2.http.POST

/** API Retrofit pour OpenAI. */
interface OpenAIService {
    /** Génère un insight coach. */
    @Headers("Content-Type: application/json")
    @POST("v1/chat/completions")
    suspend fun getInsight(@Body request: ChatRequest): ChatResponse
}
