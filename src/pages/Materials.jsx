import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/config";
import { getUserRole } from "../utils/getUserRole";
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";


export default function Materials() {
    const navigate = useNavigate();
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState(null);

    useEffect(() => {
        const unsuscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const roleData = await getUserRole(user.uid);
                    setRole(roleData);
                }
                catch (error) {
                    console.error(error);
                }
            } else {
                setRole(null);
            }
        });
        return () => unsuscribe();
    }, []);

    useEffect(() => {

        const fetchMaterials = async () => {
            try {
                const q = query(
                    collection(db, "materials"),
                    orderBy("createdAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setMaterials(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchMaterials();
    }, []);

    const handleContact = async (material) => {
        const user = auth.currentUser;
        if (!user) {
            alert("Debes iniciar sesión para contactar.");
            return;
        }

        if (user.uid === material.userId) {
            alert("No puedes contactarte a ti mismo.");
            return;
        }

        try {
            // Create a deterministic chat ID
            const participantIds = [user.uid, material.userId].sort();
            const chatId = participantIds.join("_");
            const chatRef = doc(db, "chats", chatId);

            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
                const participantData = {
                    [user.uid]: { name: user.displayName || user.email, email: user.email },
                    [material.userId]: { name: material.userName || "Usuario", email: "..." }
                };

                await setDoc(chatRef, {
                    participants: participantIds,
                    participantsData: participantData,
                    lastMessage: `Hola, me interesa tu material: ${material.type}`,
                    lastMessageTime: serverTimestamp(),
                    createdAt: serverTimestamp()
                });

                await addDoc(collection(db, "chats", chatId, "messages"), {
                    text: `Hola, me interesa tu material: ${material.type} (${material.quantity}). ¿Sigue disponible?`,
                    senderId: user.uid,
                    createdAt: serverTimestamp()
                });
            }

            navigate(`/chat/${chatId}`);

        } catch (error) {
            console.error("Error al iniciar chat:", error);
            alert("Error al iniciar chat.");
        }
    };

    if (loading) {
        return <p className="text-center mt-10">Cargando materiales...</p>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <img src="/icon_recyclo.jpeg" alt="Logo" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Materiales Disponibles
                    </h1>
                </div>
                {role === "reciclador" && (
                    <a href="/publicar" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        + Publicar Nuevo
                    </a>
                )}
            </div>

            {materials.length === 0 ? (
                <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow dark:text-gray-300">
                    <p>No hay materiales publicados aún.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {materials.map((m) => (
                        <div key={m.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col">
                            <div className="h-48 bg-gray-200 dark:bg-gray-700 relative group">
                                {m.imageUrl ? (
                                    <img
                                        src={m.imageUrl}
                                        alt={m.type}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                        <span>Sin Imagen</span>
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className="text-xs font-bold text-green-800 bg-green-100 px-2 py-1 rounded-full shadow-sm">
                                        {m.status === 'available' ? 'Disponible' : 'Recolectado'}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-lg text-gray-800 dark:text-white capitalize">{m.type}</h3>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                        {m.quantity}
                                    </span>
                                </div>

                                {m.description && (
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 flex-1">
                                        {m.description}
                                    </p>
                                )}

                                <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleDateString() : 'Reciente'}
                                    </span>

                                    {role === "centro" && m.userId !== auth.currentUser?.uid && (
                                        <button
                                            onClick={() => handleContact(m)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition shadow-sm flex items-center gap-2"
                                        >
                                            <span>💬</span> Contactar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                    }
                </div >
            )}
        </div >
    );
}
