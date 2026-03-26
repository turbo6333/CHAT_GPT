package com.coachhabits.ui.coach

import com.coachhabits.data.repository.Result
import com.coachhabits.domain.usecase.GetAIInsightUseCase
import io.mockk.coEvery
import io.mockk.mockk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

@OptIn(ExperimentalCoroutinesApi::class)
class CoachViewModelTest {
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
    fun `askCoach appends message`() = runTest {
        val useCase = mockk<GetAIInsightUseCase>()
        coEvery { useCase.invoke(any(), any(), any(), any()) } returns Result.Success("Bravo")
        val viewModel = CoachViewModel(useCase)

        viewModel.askCoach("Alex", "sport", 4, 3)
        advanceUntilIdle()

        assertTrue(viewModel.uiState.value.messages.contains("Bravo"))
    }
}
