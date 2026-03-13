package com.coachhabits.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

/** Entité Room pour les habitudes. */
@Entity(tableName = "habits")
data class HabitEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val category: String,
    val reminderTime: String,
    val streak: Int,
    val createdAt: Long
)
