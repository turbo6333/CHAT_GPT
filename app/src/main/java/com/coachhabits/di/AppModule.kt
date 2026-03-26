package com.coachhabits.di

import android.content.Context
import androidx.room.Room
import com.coachhabits.BuildConfig
import com.coachhabits.data.local.AppDatabase
import com.coachhabits.data.local.HabitDao
import com.coachhabits.data.local.LogDao
import com.coachhabits.data.remote.OpenAIService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

/** Module Hilt principal. */
@Module
@InstallIn(SingletonComponent::class)
object AppModule {
    /** Fournit la base Room. */
    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "coach_habits.db").build()
    }

    /** Fournit le DAO des habitudes. */
    @Provides
    fun provideHabitDao(db: AppDatabase): HabitDao = db.habitDao()

    /** Fournit le DAO des logs. */
    @Provides
    fun provideLogDao(db: AppDatabase): LogDao = db.logDao()

    /** Fournit Retrofit pour OpenAI. */
    @Provides
    @Singleton
    fun provideOpenAIService(): OpenAIService {
        val authInterceptor = Interceptor { chain ->
            val request = chain.request().newBuilder()
                .addHeader("Authorization", "Bearer ${BuildConfig.OPENAI_API_KEY}")
                .build()
            chain.proceed(request)
        }
        val client = OkHttpClient.Builder().addInterceptor(authInterceptor).build()
        return Retrofit.Builder()
            .baseUrl("https://api.openai.com/")
            .client(client)
            .addConverterFactory(MoshiConverterFactory.create())
            .build()
            .create(OpenAIService::class.java)
    }
}
