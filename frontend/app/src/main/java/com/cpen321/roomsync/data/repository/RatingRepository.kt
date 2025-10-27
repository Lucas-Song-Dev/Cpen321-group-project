package com.cpen321.roomsync.data.repository

import com.cpen321.roomsync.data.models.*
import com.cpen321.roomsync.data.network.RetrofitInstance
import retrofit2.HttpException
import java.io.IOException

class RatingRepository {

    suspend fun submitRating(
        ratedUserId: String,
        groupId: String,
        rating: Int,
        testimonial: String? = null
    ): RatingResponse {
        return try {
            val request = SubmitRatingRequest(
                ratedUserId = ratedUserId,
                groupId = groupId,
                rating = rating,
                testimonial = testimonial
            )
            val response = RetrofitInstance.api.submitRating(request)
            
            if (response.isSuccessful) {
                response.body() ?: RatingResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                RatingResponse(false, errorBody ?: "Submit rating failed: ${response.code()}")
            }
        } catch (e: IOException) {
            RatingResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            RatingResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            RatingResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun getUserRatings(userId: String): UserRatingsResponse {
        return try {
            val response = RetrofitInstance.api.getUserRatings(userId)
            
            if (response.isSuccessful) {
                response.body() ?: UserRatingsResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                UserRatingsResponse(false, errorBody ?: "Get ratings failed: ${response.code()}")
            }
        } catch (e: IOException) {
            UserRatingsResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            UserRatingsResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            UserRatingsResponse(false, "Unexpected error: ${e.message}")
        }
    }

    suspend fun getUserRatingsInGroup(userId: String, groupId: String): UserRatingsResponse {
        return try {
            val response = RetrofitInstance.api.getUserRatingsInGroup(userId, groupId)
            
            if (response.isSuccessful) {
                response.body() ?: UserRatingsResponse(false, "Empty response from server")
            } else {
                val errorBody = response.errorBody()?.string()
                UserRatingsResponse(false, errorBody ?: "Get group ratings failed: ${response.code()}")
            }
        } catch (e: IOException) {
            UserRatingsResponse(false, "Network error: ${e.message}")
        } catch (e: HttpException) {
            UserRatingsResponse(false, "HTTP error: ${e.code()} - ${e.message()}")
        } catch (e: Exception) {
            UserRatingsResponse(false, "Unexpected error: ${e.message}")
        }
    }
}
