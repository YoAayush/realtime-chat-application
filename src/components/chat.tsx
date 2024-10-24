'use client'

import React, { useState, useEffect } from "react"
import { ref, onValue, DatabaseReference, onChildAdded } from "firebase/database"
import { rltdb } from "./firebase"
import axios from "axios"

interface Message {
    id: string
    user: string
    text: string
}

export default function Chat() {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState("")
    const [username, setUsername] = useState("")
    const [recipient, setRecipient] = useState("")

    useEffect(() => {
        if (!username || !recipient) return

        const conversationId = [username, recipient].sort().join("_")
        console.log("conversationId", conversationId)
        const messagesRef: DatabaseReference = ref(rltdb, `messages/${conversationId}`)

        const fetchMessages = () => {
            onValue(messagesRef, (snapshot) => {
                const data = snapshot.val()
                const loadedMessages: Message[] = data
                    ? Object.entries(data).map(([id, message]) => {
                        if (typeof message === 'object' && message !== null) {
                            return {
                                id,
                                ...message,
                            }
                        }
                        return null
                    }).filter(Boolean) as Message[]
                    : []
                setMessages(loadedMessages)
            })
        }

        const unsubscribe = onChildAdded(messagesRef, (snapshot) => {
            const newMessage = snapshot.val()
            if (newMessage) {
                setMessages((prevMessages) => [...prevMessages, { id: snapshot.key , ...newMessage }])
            }
        })

        fetchMessages()

        return () => {
            unsubscribe()
        }
    }, [username, recipient])

    const handleSendMessage = async () => {
        if (newMessage.trim() === "" || username.trim() === "" || recipient.trim() === "") {
            return
        }

        const conversationId = [username, recipient].sort().join("_")

        try {
            const res = await axios.post("/api/sendMessage", {
                username,
                newMessage,
                messagesRef: `messages/${conversationId}`,
            })

            if (res.data.success) {
                console.log("Message sent successfully")
                setNewMessage("")
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div className="max-w-md mx-auto mt-8 p-4 bg-gray-800 rounded shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-500">Chat Room</h2>
            <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 mb-4 border rounded"
            />
            <input
                type="text"
                placeholder="Enter recipient's username"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 mb-4 border rounded"
            />
            <div className="h-64 overflow-y-auto border p-2 mb-4">
                {messages.map((message) => (
                    <div key={message.id} className="mb-2 text-[#ffff]">
                        <strong>{message.user}:</strong> {message.text}
                    </div>
                ))}
            </div>
            <div className="flex">
                <input
                    type="text"
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-grow px-3 py-2 border rounded-l"
                />
                <button
                    onClick={handleSendMessage}
                    className="px-4 py-2 bg-blue-500 text-white rounded-r"
                >
                    Send
                </button>
            </div>
        </div>
    )
}