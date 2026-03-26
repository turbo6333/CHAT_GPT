package com.coachhabits.ui.habits

import com.coachhabits.data.repository.HabitRepository
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HabitViewModelTest {
    private val dispatcher = StandardTestDispatcher()

    @BeforeEach
    fun setUp() {
        Dispatchers.setMain(dispatcher)
    }

    @AfterEach
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun `addHabit delegates to repository`() = runTest {
        val repository = mockk<HabitRepository>(relaxed = true)
        val viewModel = HabitViewModel(repository)

        viewModel.addHabit("Lire", "etudes", "20:00")
        advanceUntilIdle()

        coVerify(exactly = 1) { repository.createHabit(any()) }
    }
}
