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
                <h1 className="text-2xl font-bold text-gray-800">Mensajes</h1>
                <Link to="/dashboard" className="text-green-600 font-medium hover:underline">
                    Volver al Panel
                </Link>
            </div>

            {loading ? (
                <p className="text-center text-gray-400 py-8">Cargando conversaciones...</p>
            ) : chats.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xl text-gray-500 mb-2">No tienes mensajes aún</p>
                    <p className="text-sm text-gray-400">
                        Contacta a alguien desde la lista de materiales o el mapa.
                    </p>
                    <Link to="/materials" className="mt-4 inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                        Ver Materiales
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map(chat => (
                        <Link
                            key={chat.id}
                            to={`/chat/${chat.id}`}
                            className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition flex items-center gap-4"
                        >
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-xl">
                                {chat.otherUser?.name?.charAt(0).toUpperCase() || "?"}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-800 truncate">
                                        {chat.otherUser?.name || "Usuario Desconocido"}
                                    </h3>
                                    <span className="text-xs text-gray-400">
                                        {chat.lastMessageTime?.seconds
                                            ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleDateString()
                                            : ""}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.lastMessage || "Iniciar conversación..."}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
