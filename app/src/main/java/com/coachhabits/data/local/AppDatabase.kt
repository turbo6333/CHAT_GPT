package com.coachhabits.data.local

import androidx.room.Database
import androidx.room.RoomDatabase

/** Base Room de l'application. */
@Database(entities = [HabitEntity::class, LogEntity::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    /** Fournit le DAO des habitudes. */
    abstract fun habitDao(): HabitDao

    /** Fournit le DAO des logs. */
    abstract fun logDao(): LogDao
}
