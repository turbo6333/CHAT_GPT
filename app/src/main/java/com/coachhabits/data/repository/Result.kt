package com.coachhabits.data.repository

/** Résultat typé pour gérer succès/erreurs. */
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}
