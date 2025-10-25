package com.cpen321.roomsync.data.repository

import android.util.Log
import com.cpen321.roomsync.data.models.AuthRequest
import com.cpen321.roomsync.data.models.AuthResponse
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class AuthRepository {

    suspend fun login(idToken: String): AuthResponse {
        val timestamp = System.currentTimeMillis()
        Log.d("AuthRepository", "[$timestamp] Starting login with token: ${idToken.substring(0, 10)}...")
        
        return try {
            Log.d("AuthRepository", "[$timestamp] Making API call to login endpoint")
            val response = RetrofitInstance.api.login(AuthRequest(token = idToken))

            if (response.isSuccessful) {
                Log.d("AuthRepository", "[$timestamp] Login successful")
                response.body() ?: AuthResponse(false, "Empty response from server", user = null)
            } else {
                Log.e("AuthRepository", "[$timestamp] Login failed with code: ${response.code()}")
                // Extract error message from response body if available
                val errorBody = response.errorBody()?.string()
                AuthResponse(false, errorBody ?: "Login failed: ${response.code()}", user = null)
            }
        } catch (e: IOException) {
            Log.e("AuthRepository", "[$timestamp] Network error during login: ${e.message}")
            AuthResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            Log.e("AuthRepository", "[$timestamp] HTTP error during login: ${e.code()} - ${e.message()}")
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            Log.e("AuthRepository", "[$timestamp] Unexpected error during login: ${e.message}")
            AuthResponse(false, "Network error: ${e.message}", user = null)
        } catch (e: HttpException) {
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}", user = null)
        } catch (e: Exception) {
            AuthResponse(false, "Unexpected error: ${e.message}", user = null)

        }
    }

    suspend fun signup(idToken: String): AuthResponse {
        val timestamp = System.currentTimeMillis()
        Log.d("AuthRepository", "[$timestamp] Starting signup with token: ${idToken.substring(0, 10)}...")
        
        return try {
            Log.d("AuthRepository", "[$timestamp] Making API call to signup endpoint")
            val response = RetrofitInstance.api.signup(AuthRequest(token = idToken))

            if (response.isSuccessful) {
                Log.d("AuthRepository", "[$timestamp] Signup successful")
                response.body() ?: AuthResponse(false, "Empty response from server", user = null)
            } else {
                Log.e("AuthRepository", "[$timestamp] Signup failed with code: ${response.code()}")
                // Extract error message from response body if available
                val errorBody = response.errorBody()?.string()
                AuthResponse(false, errorBody ?: "Signup failed: ${response.code()}", user = null)
            }
        } catch (e: IOException) {
            Log.e("AuthRepository", "[$timestamp] Network error during signup: ${e.message}")
            AuthResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            Log.e("AuthRepository", "[$timestamp] HTTP error during signup: ${e.code()} - ${e.message()}")
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            Log.e("AuthRepository", "[$timestamp] Unexpected error during signup: ${e.message}")
            AuthResponse(false, "Network error: ${e.message}", user = null)
        } catch (e: HttpException) {
            AuthResponse(false, "HTTP error: ${e.code()} - ${e.message()}", user = null)
        } catch (e: Exception) {
            AuthResponse(false, "Unexpected error: ${e.message}", user = null)
        }
    }

    suspend fun deleteUser(): com.cpen321.roomsync.data.models.ApiResponse<Any> {
        val timestamp = System.currentTimeMillis()
        Log.d("AuthRepository", "[$timestamp] Starting delete user request")
        
        return try {
            Log.d("AuthRepository", "[$timestamp] Making API call to delete user endpoint")
            val response = RetrofitInstance.api.deleteUser()

            if (response.isSuccessful) {
                Log.d("AuthRepository", "[$timestamp] Delete user successful")
                response.body() ?: com.cpen321.roomsync.data.models.ApiResponse(false, "Empty response from server")
            } else {
                Log.e("AuthRepository", "[$timestamp] Delete user failed with code: ${response.code()}")
                val errorBody = response.errorBody()?.string()
                Log.e("AuthRepository", "[$timestamp] Error body: $errorBody")
                com.cpen321.roomsync.data.models.ApiResponse(false, errorBody ?: "Delete user failed: ${response.code()}")
            }
        } catch (e: IOException) {
            Log.e("AuthRepository", "[$timestamp] Network error during delete user: ${e.message}")
            com.cpen321.roomsync.data.models.ApiResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            Log.e("AuthRepository", "[$timestamp] HTTP error during delete user: ${e.code()} - ${e.message()}")
            com.cpen321.roomsync.data.models.ApiResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            Log.e("AuthRepository", "[$timestamp] Unexpected error during delete user: ${e.message}")
            com.cpen321.roomsync.data.models.ApiResponse(false, "Unexpected error: ${e.message}")
        }
    }
}