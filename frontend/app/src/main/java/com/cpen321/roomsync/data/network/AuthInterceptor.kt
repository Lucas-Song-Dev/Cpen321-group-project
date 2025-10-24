package com.cpen321.roomsync.data.network

import android.util.Log
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException

class AuthInterceptor : Interceptor {
    
    private var authToken: String? = null
    
    fun setAuthToken(token: String?) {
        Log.d("AuthInterceptor", "Setting auth token: ${token?.substring(0, 10)}...")
        authToken = token
    }
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        val timestamp = System.currentTimeMillis()
        
        Log.d("AuthInterceptor", "[$timestamp] Making request to: ${originalRequest.url}")
        Log.d("AuthInterceptor", "[$timestamp] Method: ${originalRequest.method}")
        
        val newRequest = if (authToken != null) {
            Log.d("AuthInterceptor", "[$timestamp] Adding Authorization header with token: ${authToken?.substring(0, 10)}...")
            originalRequest.newBuilder()
                .addHeader("Authorization", "Bearer $authToken")
                .build()
        } else {
            Log.d("AuthInterceptor", "[$timestamp] No auth token available, proceeding without Authorization header")
            originalRequest
        }
        
        val response = chain.proceed(newRequest)
        Log.d("AuthInterceptor", "[$timestamp] Response received: ${response.code} ${response.message}")
        
        return response
    }
}
