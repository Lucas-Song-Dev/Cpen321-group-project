package com.cpen321.roomsync.data.network

import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

class SocketManager {
    private var socket: Socket? = null
    private val _connectionState = MutableStateFlow(false)
    val connectionState: StateFlow<Boolean> = _connectionState.asStateFlow()
    private var isAuthenticated = false
    private var onAuthenticatedCallback: ((Boolean) -> Unit)? = null
    
    // Store callback references
    private var newMessageCallback: ((JSONObject) -> Unit)? = null
    private var pollUpdateCallback: ((JSONObject) -> Unit)? = null
    private var userJoinedCallback: ((JSONObject) -> Unit)? = null
    private var userLeftCallback: ((JSONObject) -> Unit)? = null
    
    fun connect(serverUrl: String = "https://roomsync-backend-445076519627.us-central1.run.app", token: String? = null) {
        try {
            val options = IO.Options().apply {
                forceNew = true
                reconnection = true
                reconnectionAttempts = 5
                reconnectionDelay = 1000
            }
            
            socket = IO.socket(serverUrl, options)
            
            socket?.on(Socket.EVENT_CONNECT) {
                println("SocketManager: Socket connected")
                _connectionState.value = true
                
                // Register all listeners FIRST to catch any messages that arrive during authentication
                registerListeners()
                
                // Listen for authentication response
                socket?.on("authenticated") { args ->
                    if (args.isNotEmpty()) {
                        val data = args[0] as JSONObject
                        val success = data.optBoolean("success", false)
                        isAuthenticated = success
                        if (success) {
                            println("SocketManager: Authentication successful")
                        } else {
                            println("SocketManager: Authentication failed: ${data.optString("error", "Unknown error")}")
                        }
                        onAuthenticatedCallback?.invoke(success)
                    }
                }
                
                // Authenticate if token is provided
                if (token != null) {
                    println("SocketManager: Authenticating with token")
                    socket?.emit("authenticate", token)
                }
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                println("SocketManager: Socket disconnected")
                _connectionState.value = false
                isAuthenticated = false
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) { args ->
                println("SocketManager: Connection error: ${args.joinToString()}")
                _connectionState.value = false
                isAuthenticated = false
            }
            
            socket?.on("reconnect") {
                println("SocketManager: Socket reconnected")
                _connectionState.value = true
                // Re-register listeners after reconnection
                registerListeners()
            }
            
            socket?.on("reconnect_error") { args ->
                println("SocketManager: Reconnection error: ${args.joinToString()}")
            }
            
            socket?.connect()
        } catch (e: Exception) {
            _connectionState.value = false
            isAuthenticated = false
        }
    }
    
    private fun registerListeners() {
        println("SocketManager: Registering all listeners")
        
        socket?.on("new-message") { args ->
            println("SocketManager: Received new-message event with ${args.size} args")
            if (args.isNotEmpty()) {
                val messageData = args[0] as JSONObject
                println("SocketManager: Message data: $messageData")
                newMessageCallback?.invoke(messageData)
            }
        }
        
        socket?.on("poll-update") { args ->
            if (args.isNotEmpty()) {
                pollUpdateCallback?.invoke(args[0] as JSONObject)
            }
        }
        
        socket?.on("user-joined") { args ->
            if (args.isNotEmpty()) {
                userJoinedCallback?.invoke(args[0] as JSONObject)
            }
        }
        
        socket?.on("user-left") { args ->
            if (args.isNotEmpty()) {
                userLeftCallback?.invoke(args[0] as JSONObject)
            }
        }
    }
    
    fun isConnected(): Boolean {
        return socket?.connected() == true && isAuthenticated
    }
    
    fun joinGroup(groupId: String) {
        println("SocketManager: Joining group: $groupId")
        socket?.emit("join-group", groupId)
    }
    
    fun leaveGroup(groupId: String) {
        socket?.emit("leave-group", groupId)
    }
    
    fun sendMessage(groupId: String, content: String, senderId: String) {
        val messageData = JSONObject().apply {
            put("groupId", groupId)
            put("content", content)
            put("senderId", senderId)
        }
        println("SocketManager: Emitting send-message with data: $messageData")
        socket?.emit("send-message", messageData)
    }
    
    fun createPoll(groupId: String, question: String, options: List<String>, senderId: String, durationDays: Int = 7) {
        val pollData = JSONObject().apply {
            put("groupId", groupId)
            put("question", question)
            put("options", options.joinToString(","))
            put("senderId", senderId)
            put("durationDays", durationDays)
        }
        socket?.emit("create-poll", pollData)
    }
    
    fun voteOnPoll(pollId: String, option: String, userId: String) {
        val voteData = JSONObject().apply {
            put("pollId", pollId)
            put("option", option)
            put("userId", userId)
        }
        socket?.emit("vote-poll", voteData)
    }
    
    fun onNewMessage(callback: (JSONObject) -> Unit) {
        println("SocketManager: Setting up new-message callback")
        newMessageCallback = callback
        // Don't register listener here - it's already registered in registerListeners()
    }
    
    fun onPollUpdate(callback: (JSONObject) -> Unit) {
        pollUpdateCallback = callback
        // Don't register listener here - it's already registered in registerListeners()
    }
    
    fun onUserJoined(callback: (JSONObject) -> Unit) {
        userJoinedCallback = callback
        // Don't register listener here - it's already registered in registerListeners()
    }
    
    fun onUserLeft(callback: (JSONObject) -> Unit) {
        userLeftCallback = callback
        // Don't register listener here - it's already registered in registerListeners()
    }
    
    fun onAuthenticated(callback: (Boolean) -> Unit) {
        onAuthenticatedCallback = callback
    }
    
    fun disconnect() {
        // Clear all callbacks to prevent memory leaks
        newMessageCallback = null
        pollUpdateCallback = null
        userJoinedCallback = null
        userLeftCallback = null
        onAuthenticatedCallback = null
        
        socket?.disconnect()
        socket = null
        _connectionState.value = false
        isAuthenticated = false
    }
    
    fun clearListeners() {
        // Clear all callbacks without disconnecting
        newMessageCallback = null
        pollUpdateCallback = null
        userJoinedCallback = null
        userLeftCallback = null
        onAuthenticatedCallback = null
    }
}

