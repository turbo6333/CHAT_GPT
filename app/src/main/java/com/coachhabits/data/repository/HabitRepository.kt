package com.coachhabits.data.repository

import com.coachhabits.data.local.HabitDao
import com.coachhabits.data.local.HabitEntity
import com.coachhabits.data.local.LogDao
import com.coachhabits.data.local.LogEntity
import com.coachhabits.domain.model.DailyLog
import com.coachhabits.domain.model.Habit
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/** Source de vérité des habitudes et logs. */
class HabitRepository @Inject constructor(
    private val habitDao: HabitDao,
    private val logDao: LogDao
) {
    /** Observe toutes les habitudes. */
    fun observeHabits(): Flow<List<Habit>> = habitDao.observeHabits().map { list ->
        list.map { it.toDomain() }
    }

    /** Crée une nouvelle habitude. */
    suspend fun createHabit(habit: Habit) {
        habitDao.insertHabit(habit.toEntity())
    }

    /** Enregistre un check-in et met à jour le streak simple. */
    suspend fun logHabit(log: DailyLog, currentStreak: Int) {
        logDao.insertLog(log.toEntity())
        val nextStreak = if (log.done) currentStreak + 1 else 0
        habitDao.updateStreak(log.habitId, nextStreak)
    }

    /** Retourne le nombre de validations. */
    suspend fun completedCount(habitId: Long): Int = logDao.completedCount(habitId)

    private fun HabitEntity.toDomain(): Habit = Habit(id, name, category, reminderTime, streak, createdAt)

    private fun Habit.toEntity(): HabitEntity = HabitEntity(id, name, category, reminderTime, streak, createdAt)

    private fun DailyLog.toEntity(): LogEntity = LogEntity(id, habitId, date, done, mood)
}
