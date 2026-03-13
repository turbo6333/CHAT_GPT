package com.coachhabits.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

/** DAO des habitudes. */
@Dao
interface HabitDao {
    /** Retourne toutes les habitudes. */
    @Query("SELECT * FROM habits ORDER BY createdAt DESC")
    fun observeHabits(): Flow<List<HabitEntity>>

    /** Insère une habitude. */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHabit(entity: HabitEntity)

    /** Met à jour un streak. */
    @Query("UPDATE habits SET streak = :streak WHERE id = :habitId")
    suspend fun updateStreak(habitId: Long, streak: Int)
}
