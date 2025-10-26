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
    
    fun connect(serverUrl: String = "http://10.0.2.2:3000", token: String? = null) {
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
                // Authenticate if token is provided
                if (token != null) {
                    println("SocketManager: Authenticating with token")
                    socket?.emit("authenticate", token)
                    isAuthenticated = true
                }
            }
            
            socket?.on(Socket.EVENT_DISCONNECT) {
                _connectionState.value = false
                isAuthenticated = false
            }
            
            socket?.on(Socket.EVENT_CONNECT_ERROR) {
                _connectionState.value = false
                isAuthenticated = false
            }
            
            socket?.connect()
        } catch (e: Exception) {
            _connectionState.value = false
            isAuthenticated = false
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
        println("SocketManager: Setting up new-message listener")
        socket?.on("new-message") { args ->
            println("SocketManager: Received new-message event with ${args.size} args")
            if (args.isNotEmpty()) {
                val messageData = args[0] as JSONObject
                println("SocketManager: Message data: $messageData")
                callback(messageData)
            }
        }
    }
    
    fun onPollUpdate(callback: (JSONObject) -> Unit) {
        socket?.on("poll-update") { args ->
            if (args.isNotEmpty()) {
                callback(args[0] as JSONObject)
            }
        }
    }
    
    fun onUserJoined(callback: (JSONObject) -> Unit) {
        socket?.on("user-joined") { args ->
            if (args.isNotEmpty()) {
                callback(args[0] as JSONObject)
            }
        }
    }
    
    fun onUserLeft(callback: (JSONObject) -> Unit) {
        socket?.on("user-left") { args ->
            if (args.isNotEmpty()) {
                callback(args[0] as JSONObject)
            }
        }
    }
    
    fun disconnect() {
        socket?.disconnect()
        socket = null
        _connectionState.value = false
        isAuthenticated = false
    }
}

