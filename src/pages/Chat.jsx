import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    updateDoc
} from "firebase/firestore";

export default function Chat() {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [chatData, setChatData] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const dummyDiv = useRef(null);

    const currentUser = auth.currentUser;

    // 1. Fetch Chat Data & Participant Info
    useEffect(() => {
        if (!currentUser) return;

        const fetchChatData = async () => {
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (chatSnap.exists()) {
                const data = chatSnap.data();
                setChatData(data);

                // Determine who the "other" user is
                const otherUid = data.participants.find(uid => uid !== currentUser.uid);
                if (otherUid && data.participantsData && data.participantsData[otherUid]) {
                    setOtherUser(data.participantsData[otherUid]);
                }
            } else {
                // Handle chat not found
                navigate("/dashboard");
            }
        };

        fetchChatData();
    }, [chatId, currentUser, navigate]);

    // 2. Subscribe to Messages
    useEffect(() => {
        const q = query(
            collection(db, "chats", chatId, "messages"),
            orderBy("createdAt", "asc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [chatId]);

    // 3. Auto-scroll to bottom
    useEffect(() => {
        dummyDiv.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const text = newMessage;
        setNewMessage("");

        try {
            // Add message to subcollection
            await addDoc(collection(db, "chats", chatId, "messages"), {
                text,
                senderId: currentUser.uid,
                createdAt: serverTimestamp(),
            });

            // Update chat metadata (last message, unread count, etc.)
            const chatRef = doc(db, "chats", chatId);
            await updateDoc(chatRef, {
                lastMessage: text,
                lastMessageTime: serverTimestamp(),
                lastSenderId: currentUser.uid
                // Logic for unread counts could go here (increment for other user)
            });

        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!currentUser) return <div className="p-4">Cargando auth...</div>;
    if (!chatData) return <div className="p-4">Cargando chat...</div>;

    return (
        <div className="flex flex-col h-screen max-w-2xl mx-auto bg-white shadow-xl relative">
            {/* Header */}
            <div className="bg-green-600 text-white p-4 flex items-center shadow-md z-10">
                <button onClick={() => navigate("/chats")} className="mr-4 text-2xl font-bold">
                    ←
                </button>
                <div>
                    <h2 className="font-bold text-lg">{otherUser?.name || "Usuario"}</h2>
                    <p className="text-xs text-green-100">{otherUser?.email}</p>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
                {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser.uid;
                    return (
                        <div
                            key={msg.id}
                            className={`max-w-[80%] p-3 rounded-xl shadow-sm text-sm ${isMe
                                ? "bg-green-100 text-green-900 self-end rounded-tr-none"
                                : "bg-white text-gray-800 self-start rounded-tl-none border border-gray-100"
                                }`}
                        >
                            <p>{msg.text}</p>
                            <span className="text-[10px] opacity-70 block text-right mt-1">
                                {msg.createdAt?.seconds
                                    ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                    : "..."}
                            </span>
                        </div>
                    );
                })}
                <div ref={dummyDiv} />
            </div>

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
                <input
                    type="text"
                    className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition"
                    placeholder="Escribe un mensaje..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-green-600 text-white p-3 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md w-12 h-12 flex items-center justify-center transform active:scale-95"
                >
                    ➤
                </button>
            </form>
        </div>
    );
}
