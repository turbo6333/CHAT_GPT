package com.coachhabits.domain.model

/** Modèle métier d'un suivi quotidien. */
data class DailyLog(
    val id: Long = 0,
    val habitId: Long,
    val date: String,
    val done: Boolean,
    val mood: Int
)
