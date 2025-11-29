package com.cpen321.roomsync.data.network

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object RetrofitInstance {
    // Production backend for normal app traffic (login, groups, chat, etc.)
    private const val BASE_URL = "https://roomsync-backend-445076519627.us-central1.run.app/"

    // Local backend for report endpoints while testing
    private const val REPORT_BASE_URL = "http://10.0.2.2:4000/"

    private val authInterceptor = AuthInterceptor()

    private val okHttpClient = OkHttpClient.Builder()
        .addInterceptor(authInterceptor)
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    // Main API for login, tasks, chat, etc.
    val api: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    // Separate API instance for report-related calls
    val reportApi: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(REPORT_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun setAuthToken(token: String?) {
        authInterceptor.setAuthToken(token)
    }
}
