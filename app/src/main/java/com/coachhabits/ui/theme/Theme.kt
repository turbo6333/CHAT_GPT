package com.coachhabits.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(primary = PurpleIndigoDark)
private val LightColors = lightColorScheme(primary = PurpleIndigoLight)

/** Thème Material 3 CoachHabits. */
@Composable
fun CoachHabitsTheme(content: @Composable () -> Unit) {
    val scheme = if (isSystemInDarkTheme()) DarkColors else LightColors
    MaterialTheme(colorScheme = scheme, content = content)
}
