package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.AuthRequest
import com.cpen321.roomsync.data.models.AuthResponse
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class AuthRepository {

    suspend fun login(idToken: String): AuthResponse {
        return try {
            val response = RetrofitInstance.api.login(AuthRequest(token = idToken))

            if (response.isSuccessful) {
                response.body() ?: AuthResponse(false, "Empty response from server", user = null)
            } else {
                // Extract error message from response body if available
                val errorBody = response.errorBody()?.string()
                AuthResponse(false, errorBody ?: "Login failed: ${response.code()}", user = null)
            }
        } catch (e: IOException) {
            AuthResponse(false, "Network error: ${e.message}", user = null)
        } catch (e: HttpException) {
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}", user = null)
        } catch (e: Exception) {
            AuthResponse(false, "Unexpected error: ${e.message}", user = null)
        }
    }

    suspend fun signup(idToken: String): AuthResponse {
        return try {
            val response = RetrofitInstance.api.signup(AuthRequest(token = idToken))

            if (response.isSuccessful) {
                response.body() ?: AuthResponse(false, "Empty response from server", user = null)
            } else {
                // Extract error message from response body if available
                val errorBody = response.errorBody()?.string()
                AuthResponse(false, errorBody ?: "Signup failed: ${response.code()}", user = null)
            }
        } catch (e: IOException) {
            AuthResponse(false, "Network error: ${e.message}", user = null)
        } catch (e: HttpException) {
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}", user = null)
        } catch (e: Exception) {
            AuthResponse(false, "Unexpected error: ${e.message}", user = null)
        }
    }
}