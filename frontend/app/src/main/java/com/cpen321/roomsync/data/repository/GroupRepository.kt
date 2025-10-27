package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.*
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class GroupRepository {

    suspend fun createGroup(name: String): GroupResponse {
        return try {
            println("GroupRepository: Creating group with name: $name")
            val response = RetrofitInstance.api.createGroup(CreateGroupRequest(name))
            println("GroupRepository: API response code: ${response.code()}")
            
            if (response.isSuccessful) {
                val body = response.body()
                println("GroupRepository: Response body: $body")
                body ?: GroupResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                println("GroupRepository: Error response: $errorBody")
                GroupResponse(false, errorBody ?: "Create group failed: ${response.code()}")
            }
        } catch (e: IOException) {
            println("GroupRepository: IOException: ${e.message}")
            GroupResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            println("GroupRepository: HttpException: ${e.code()} - ${e.message()}")
            GroupResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            println("GroupRepository: Exception: ${e.message}")
            e.printStackTrace()
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

    suspend fun removeMember(memberId: String): GroupResponse {
        return try {
            println("GroupRepository: Removing member with ID: $memberId")
            val response = RetrofitInstance.api.removeMember(memberId)
            println("GroupRepository: Remove member response code: ${response.code()}")
            
            if (response.isSuccessful) {
                val body = response.body()
                println("GroupRepository: Remove member response body: $body")
                body ?: GroupResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                println("GroupRepository: Remove member error response: $errorBody")
                GroupResponse(false, errorBody ?: "Remove member failed: ${response.code()}")
            }
        } catch (e: IOException) {
            println("GroupRepository: Remove member IOException: ${e.message}")
            GroupResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            println("GroupRepository: Remove member HttpException: ${e.code()} - ${e.message()}")
            GroupResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            println("GroupRepository: Remove member Exception: ${e.message}")
            e.printStackTrace()
            GroupResponse(false, "Unexpected error: ${e.message}")
        }
    }
}
