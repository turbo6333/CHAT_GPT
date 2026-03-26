package com.coachhabits.ui

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.coachhabits.MainActivity
import org.junit.Rule
import org.junit.Test

class MainScreensTest {
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()

    @Test
    fun bottomNavigationIsDisplayed() {
        composeRule.onNodeWithText("Dashboard").assertIsDisplayed()
        composeRule.onNodeWithText("Habitudes").assertIsDisplayed()
        composeRule.onNodeWithText("Coach").assertIsDisplayed()
        composeRule.onNodeWithText("Profil").assertIsDisplayed()
    }
}
