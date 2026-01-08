import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";

export default function ChatList() {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentUser = auth.currentUser;
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser) {
            navigate("/");
            return;
        }

        // Query chats where current user is in participants
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", currentUser.uid),
            orderBy("lastMessageTime", "desc") // requires index usually
        );

        // Note in MVP: ordering by 'desc' on query with 'array-contains' might require a Firestore Index.
        // If it fails, check console and create the index via the link provided by Firebase.
        // Alternatively, sort manually on client for MVP if list is small.

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const chatData = snapshot.docs.map(doc => {
                const data = doc.data();
                const otherUid = data.participants.find(uid => uid !== currentUser.uid);
                const otherUser = data.participantsData ? data.participantsData[otherUid] : null;

                return {
                    id: doc.id,
                    ...data,
                    otherUser
                };
            });

            // Fallback client-side sort if query sort fails due to missing index
            chatData.sort((a, b) => (b.lastMessageTime?.seconds || 0) - (a.lastMessageTime?.seconds || 0));

            setChats(chatData);
            setLoading(false);
        }, (error) => {
            console.error("Firestore Error:", error);
            // Fallback for missing index error
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser, navigate]);

    return (
        <div className="max-w-2xl mx-auto p-4 min-h-screen">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <img src="/icon_recyclo.jpeg" alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Mensajes</h1>
                </div>
                <Link to="/dashboard" className="text-green-600 font-medium hover:underline dark:text-green-400">
                    Volver al Panel
                </Link>
            </div>

            {loading ? (
                <p className="text-center text-gray-400 py-8">Cargando conversaciones...</p>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-100 dark:border-gray-700">
                    {chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <p>No tienes mensajes aún.</p>
                            <p className="text-sm mt-2">Contacta a alguien desde el mapa o la lista de materiales.</p>
                        </div>
                    ) : (
                        <ul>
                            {chats.map(chat => {
                                const otherUserId = chat.participants.find(uid => uid !== auth.currentUser.uid);
                                const otherUser = chat.participantsData?.[otherUserId] || { name: 'Usuario' };

                                return (
                                    <li key={chat.id} className="border-b dark:border-gray-700 last:border-none">
                                        <Link
                                            to={`/chat/${chat.id}`}
                                            className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                        >
                                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-xl mr-4">
                                                {otherUser.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                                        {otherUser.name}
                                                    </h3>
                                                    {chat.lastMessageTime && (
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(chat.lastMessageTime.seconds * 1000).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">{chat.lastMessage}</p>
                                            </div>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}
