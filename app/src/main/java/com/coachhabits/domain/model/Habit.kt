package com.coachhabits.domain.model

/** Modèle métier d'une habitude. */
data class Habit(
    val id: Long = 0,
    val name: String,
    val category: String,
    val reminderTime: String,
    val streak: Int = 0,
    val createdAt: Long = System.currentTimeMillis()
)
