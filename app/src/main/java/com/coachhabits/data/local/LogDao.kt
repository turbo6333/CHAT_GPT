package com.coachhabits.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

/** DAO des logs quotidiens. */
@Dao
interface LogDao {
    /** Insère un log quotidien. */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLog(entity: LogEntity)

    /** Compte les validations d'une habitude. */
    @Query("SELECT COUNT(*) FROM logs WHERE habitId = :habitId AND done = 1")
    suspend fun completedCount(habitId: Long): Int
}
