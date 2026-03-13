package com.coachhabits.worker

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.coachhabits.R

/** Worker pour les rappels quotidiens. */
class ReminderWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(appContext, workerParams) {

    /** Exécute l'envoi de la notification journalière. */
    override suspend fun doWork(): Result {
        val manager = applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(NotificationChannel("coachhabits", "CoachHabits", NotificationManager.IMPORTANCE_DEFAULT))
        val notification = NotificationCompat.Builder(applicationContext, "coachhabits")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(applicationContext.getString(R.string.reminder_title))
            .setContentText(applicationContext.getString(R.string.reminder_content))
            .build()
        if (canNotify()) manager.notify(1, notification)
        return Result.success()
    }

    /** Vérifie la permission notification. */
    private fun canNotify(): Boolean {
        return ContextCompat.checkSelfPermission(
            applicationContext,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
    }
}
