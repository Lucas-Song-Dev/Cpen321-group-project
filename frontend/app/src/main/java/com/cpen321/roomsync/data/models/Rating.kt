package com.cpen321.roomsync.data.models

import java.util.*

data class RatingUser(
    val _id: String,
    val email: String,
    val name: String
)

data class RatingGroup(
    val _id: String,
    val name: String
)

data class Rating(
    val _id: String,
    val ratedUserId: String,
    val raterUserId: RatingUser, // Populated from backend
    val groupId: RatingGroup, // Populated from backend
    val rating: Int, // 1-5 stars
    val testimonial: String? = null,
    val timeSpentMinutes: Int,
    val createdAt: String
)

data class SubmitRatingRequest(
    val ratedUserId: String,
    val groupId: String,
    val rating: Int, // 1-5 stars
    val testimonial: String? = null
)

data class RatingResponse(
    val success: Boolean,
    val message: String? = null,
    val data: Rating? = null
)

data class UserRatingsData(
    val ratings: List<Rating>,
    val averageRating: Double,
    val totalRatings: Int
)

data class UserRatingsResponse(
    val success: Boolean,
    val message: String? = null,
    val data: UserRatingsData? = null
)
