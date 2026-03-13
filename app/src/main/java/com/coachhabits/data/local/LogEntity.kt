package com.coachhabits.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Entité Room pour les check-ins quotidiens. */
@Entity(tableName = "logs")
data class LogEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val habitId: Long,
    val date: String,
    val done: Boolean,
    val mood: Int
)
