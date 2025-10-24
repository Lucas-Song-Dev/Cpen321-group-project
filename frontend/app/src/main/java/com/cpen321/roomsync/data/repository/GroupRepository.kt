package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.*
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class GroupRepository {

    suspend fun createGroup(name: String): GroupResponse {
        return try {
            val response = RetrofitInstance.api.createGroup(CreateGroupRequest(name))
            if (response.isSuccessful) {
                response.body() ?: GroupResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                GroupResponse(false, errorBody ?: "Create group failed: ${response.code()}")
            }
        } catch (e: IOException) {
            GroupResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            GroupResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            GroupResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun joinGroup(groupCode: String): GroupResponse {
        return try {
            val response = RetrofitInstance.api.joinGroup(JoinGroupRequest(groupCode))
            if (response.isSuccessful) {
                response.body() ?: GroupResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                GroupResponse(false, errorBody ?: "Join group failed: ${response.code()}")
            }
        } catch (e: IOException) {
            GroupResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            GroupResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            GroupResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun getGroup(): GroupResponse {
        return try {
            val response = RetrofitInstance.api.getGroup()
            if (response.isSuccessful) {
                response.body() ?: GroupResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                GroupResponse(false, errorBody ?: "Get group failed: ${response.code()}")
            }
        } catch (e: IOException) {
            GroupResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            GroupResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            GroupResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun leaveGroup(): ApiResponse<Any> {
        return try {
            val response = RetrofitInstance.api.leaveGroup()
            if (response.isSuccessful) {
                response.body() ?: ApiResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                ApiResponse(false, errorBody ?: "Leave group failed: ${response.code()}")
            }
        } catch (e: IOException) {
            ApiResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            ApiResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            ApiResponse(false, "Unexpected error: ${e.message}")
        }
    }
}
