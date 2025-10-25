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
    val error: String? = null
)

class GroupViewModel(
    private val groupRepository: GroupRepository = GroupRepository()
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(GroupUiState())
    val uiState: StateFlow<GroupUiState> = _uiState.asStateFlow()
    
    init {
        loadGroup()
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
                    
                    val groupMembers = group.members.map { member ->
                        ViewModelGroupMember(
                            id = member.userId._id,
                            name = member.userId.name ?: "Unknown",
                            email = member.userId.email,
                            joinDate = Date(member.joinDate.toLongOrNull() ?: System.currentTimeMillis()),
                            moveInDate = member.moveInDate?.let { Date(it.toLongOrNull() ?: System.currentTimeMillis()) }
                        )
                    }
                    
                    val owner = ViewModelGroupMember(
                        id = group.owner._id,
                        name = group.owner.name ?: "Unknown",
                        email = group.owner.email,
                        joinDate = Date(System.currentTimeMillis())
                    )
                    
                    val uiGroup = Group(
                        id = group._id,
                        name = group.name,
                        groupCode = group.groupCode,
                        owner = owner,
                        members = groupMembers,
                        createdAt = Date(group.createdAt.toLongOrNull() ?: System.currentTimeMillis()),
                        updatedAt = Date(group.updatedAt.toLongOrNull() ?: System.currentTimeMillis())
                    )
                    
                    println("GroupViewModel: Group loaded successfully")
                    _uiState.value = _uiState.value.copy(
                        group = uiGroup,
                        isLoading = false
                    )
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
                if (response.success) {
                    _uiState.value = _uiState.value.copy(
                        group = null,
                        isLoading = false
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
    
    fun refreshGroup() {
        loadGroup()
    }
}