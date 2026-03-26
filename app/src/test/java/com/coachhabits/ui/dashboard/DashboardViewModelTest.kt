package com.coachhabits.ui.dashboard

import com.coachhabits.domain.model.Habit
import com.coachhabits.domain.usecase.GetHabitsUseCase
import io.mockk.every
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
class DashboardViewModelTest {
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
    fun `observeHabits updates ui state`() = runTest {
        val useCase = mockk<GetHabitsUseCase>()
        every { useCase.invoke() } returns flowOf(listOf(Habit(name = "Sport", category = "sport", reminderTime = "08:00")))

        val viewModel = DashboardViewModel(useCase)
        advanceUntilIdle()

        assertEquals(1, viewModel.uiState.value.habits.size)
    }
}
