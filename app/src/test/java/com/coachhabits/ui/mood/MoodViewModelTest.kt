package com.coachhabits.ui.mood

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class MoodViewModelTest {
    @Test
    fun `setMood clamps values`() {
        val viewModel = MoodViewModel()

        viewModel.setMood(9)

        assertEquals(5, viewModel.mood.value)
    }
}
