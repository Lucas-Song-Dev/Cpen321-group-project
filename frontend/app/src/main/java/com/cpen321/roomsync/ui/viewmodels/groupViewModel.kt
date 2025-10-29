package com.cpen321.roomsync.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.cpen321.roomsync.data.models.Group as ApiGroup
import com.cpen321.roomsync.data.repository.GroupRepository
import com.cpen321.roomsync.ui.viewmodels.ViewModelGroupMember
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.*


data class Group(
    val id: String,
    val name: String,
    val groupCode: String,
    val owner: ViewModelGroupMember,
    val members: List<ViewModelGroupMember>,
    val createdAt: Date,
    val updatedAt: Date
)

data class GroupUiState(
    val group: Group? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val leftGroup: Boolean = false
)

class GroupViewModel(
    private val groupRepository: GroupRepository = GroupRepository()
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(GroupUiState())
    val uiState: StateFlow<GroupUiState> = _uiState.asStateFlow()
    
    init {
        loadGroup()
    }
    
    private fun parseIsoDate(isoString: String): Date {
        return try {
            // Parse ISO 8601 date string (e.g., "2025-10-27T02:04:13.878Z")
            val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", java.util.Locale.US)
            format.timeZone = java.util.TimeZone.getTimeZone("UTC")
            val parsedDate = format.parse(isoString)
            println("GroupViewModel: Parsed ISO date '$isoString' to ${parsedDate}")
            parsedDate ?: Date(System.currentTimeMillis())
        } catch (e: Exception) {
            println("GroupViewModel: Failed to parse ISO date '$isoString': ${e.message}")
            // Fallback: Try parsing as timestamp
            try {
                val timestamp = isoString.toLongOrNull()
                if (timestamp != null) {
                    println("GroupViewModel: Parsed as timestamp: $timestamp")
                    Date(timestamp)
                } else {
                    println("GroupViewModel: Not a valid timestamp, using current time")
                    Date(System.currentTimeMillis())
                }
            } catch (e2: Exception) {
                println("GroupViewModel: All parsing failed, using current time")
                Date(System.currentTimeMillis())
            }
        }
    }
    
    private fun loadGroup() {
        viewModelScope.launch {
            try {
                println("GroupViewModel: Loading group...")
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = groupRepository.getGroup()
                println("GroupViewModel: Get group response - success: ${response.success}, message: ${response.message}")
                
                if (response.success && response.data != null) {
                    val group = response.data
                    println("GroupViewModel: Group data received: ${group.name}, id: ${group._id}")
                    
                    // Log member details for debugging with error handling
                    group.members.forEachIndexed { index, member ->
                        try {
                            if (member.userId?.name != null) {
                                println("GroupViewModel: Processing member $index - Name: ${member.userId.name}, Join Date String: '${member.joinDate}'")
                                val joinDate = parseIsoDate(member.joinDate)
                                val now = Date()
                                val durationMs = now.time - joinDate.time
                                val days = (durationMs / (1000 * 60 * 60 * 24)).toInt()
                                println("GroupViewModel: Member ${member.userId.name} - Join Date: $joinDate, Days ago: $days")
                            } else {
                                println("GroupViewModel: Skipping invalid member $index - missing user data")
                            }
                        } catch (e: Exception) {
                            println("GroupViewModel: Error processing member $index: ${e.message}")
                        }
                    }
                    
                    try {
                        val uiGroup = convertApiGroupToViewModel(group)
                        
                        println("GroupViewModel: Group loaded successfully")
                        _uiState.value = _uiState.value.copy(
                            group = uiGroup,
                            isLoading = false
                        )
                    } catch (e: Exception) {
                        println("GroupViewModel: Error converting group to view model: ${e.message}")
                        _uiState.value = _uiState.value.copy(
                            error = "Failed to process group data: ${e.message}",
                            isLoading = false
                        )
                    }
                } else {
                    // User doesn't have a group yet - this is normal, not an error
                    println("GroupViewModel: User doesn't have a group yet (not an error)")
                    _uiState.value = _uiState.value.copy(
                        group = null,
                        error = null, // Don't show error if user simply doesn't have a group
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                println("GroupViewModel: Exception loading group: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    error = "Failed to load group: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    fun createGroup(name: String) {
        viewModelScope.launch {
            try {
                println("GroupViewModel: Starting group creation with name: $name")
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = groupRepository.createGroup(name)
                println("GroupViewModel: Create group response - success: ${response.success}, message: ${response.message}")
                println("GroupViewModel: Group data: ${response.data}")
                
                if (response.success) {
                    println("GroupViewModel: Group created successfully, refreshing group data")
                    loadGroup() // Refresh group data
                } else {
                    println("GroupViewModel: Group creation failed: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to create group",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                println("GroupViewModel: Exception during group creation: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    error = "Failed to create group: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    fun joinGroup(groupCode: String) {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = groupRepository.joinGroup(groupCode)
                if (response.success) {
                    loadGroup() // Refresh group data
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to join group",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to join group: ${e.message}",
                    isLoading = false
                )
            }
        }
    }
    
    fun leaveGroup() {
        viewModelScope.launch {
            try {
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = groupRepository.leaveGroup()
                if (response.success || (response.message?.contains("not a member", ignoreCase = true) == true)) {
                    println("GroupViewModel: Leave group treated as success (success=${response.success}, message='${response.message}')")
                    _uiState.value = _uiState.value.copy(
                        group = null,
                        isLoading = false,
                        leftGroup = true
                    )
                } else {
                    _uiState.value = _uiState.value.copy(
                        error = response.message ?: "Failed to leave group",
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = "Failed to leave group: ${e.message}",
                    isLoading = false
                )
            }
        }
    }

    fun consumeLeftGroupEvent() {
        if (_uiState.value.leftGroup) {
            _uiState.value = _uiState.value.copy(leftGroup = false)
        }
    }
    
    private fun convertApiGroupToViewModel(apiGroup: ApiGroup): Group {
        val groupMembers = apiGroup.members.mapNotNull { member ->
            try {
                // Skip members with invalid user data
                if (member.userId?._id == null) {
                    println("GroupViewModel: Skipping member with invalid user ID")
                    return@mapNotNull null
                }
                
                val joinDate = parseIsoDate(member.joinDate)
                
                ViewModelGroupMember(
                    id = member.userId._id,
                    name = member.userId.name ?: "Unknown",
                    email = member.userId.email ?: "",
                    joinDate = joinDate,
                    moveInDate = member.moveInDate?.let { parseIsoDate(it) }
                )
            } catch (e: Exception) {
                println("GroupViewModel: Error converting member: ${e.message}")
                null
            }
        }
        
        val owner = try {
            // Handle case where owner might be deleted or invalid
            val ownerId = apiGroup.owner?._id ?: "deleted-owner"
            val ownerName = apiGroup.owner?.name ?: "Deleted User"
            val ownerEmail = apiGroup.owner?.email ?: ""
            
            // If owner is deleted, try to find a valid member to show as owner
            if (ownerId == "deleted-owner" || ownerName == "Deleted User") {
                val validMember = groupMembers.firstOrNull { it.id != "unknown" }
                if (validMember != null) {
                    println("GroupViewModel: Using valid member as owner: ${validMember.name}")
                    validMember.copy(isAdmin = true)
                } else {
                    ViewModelGroupMember(
                        id = ownerId,
                        name = ownerName,
                        email = ownerEmail,
                        joinDate = Date(System.currentTimeMillis()),
                        isAdmin = true
                    )
                }
            } else {
                ViewModelGroupMember(
                    id = ownerId,
                    name = ownerName,
                    email = ownerEmail,
                    joinDate = Date(System.currentTimeMillis()),
                    isAdmin = true
                )
            }
        } catch (e: Exception) {
            println("GroupViewModel: Error creating owner member: ${e.message}")
            ViewModelGroupMember(
                id = "deleted-owner",
                name = "Deleted User",
                email = "",
                joinDate = Date(System.currentTimeMillis()),
                isAdmin = true
            )
        }
        
        return Group(
            id = apiGroup._id,
            name = apiGroup.name,
            groupCode = apiGroup.groupCode,
            owner = owner,
            members = groupMembers,
            createdAt = parseIsoDate(apiGroup.createdAt),
            updatedAt = parseIsoDate(apiGroup.updatedAt)
        )
    }
    
    fun refreshGroup() {
        loadGroup()
    }
    
    fun removeMember(memberId: String) {
        viewModelScope.launch {
            try {
                println("GroupViewModel: Removing member with ID: $memberId")
                _uiState.value = _uiState.value.copy(isLoading = true)
                
                val response = groupRepository.removeMember(memberId)
                
                if (response.success && response.data != null) {
                    println("GroupViewModel: Member removed successfully")
                    // Convert API group to ViewModel group
                    val apiGroup = response.data
                    val group = convertApiGroupToViewModel(apiGroup)
                    _uiState.value = _uiState.value.copy(
                        group = group,
                        isLoading = false,
                        error = null
                    )
                } else {
                    println("GroupViewModel: Failed to remove member: ${response.message}")
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = response.message ?: "Failed to remove member"
                    )
                }
            } catch (e: Exception) {
                println("GroupViewModel: Exception during member removal: ${e.message}")
                e.printStackTrace()
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = "Failed to remove member: ${e.message}"
                )
            }
        }
    }
}