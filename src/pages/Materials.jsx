import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { getUserRole } from "../utils/getUserRole";
import { collection, getDocs, orderBy, query, doc, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";


export default function Materials() {
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

    if (loading) {
        return <p className="text-center mt-10">Cargando materiales...</p>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    Materiales Disponibles
                </h1>
                {role === "reciclador" && (
                    <a href="/publicar" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                        + Publicar Nuevo
                    </a>
                )}
            </div>

            {materials.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <p className="text-xl text-gray-500">No hay materiales publicados aún.</p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    {materials.map((material) => (
                        <div
                            key={material.id}
                            className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden flex flex-col h-full"
                        >
                            <div className="h-48 bg-gray-100 relative">
                                {material.imageUrl ? (
                                    <img
                                        src={material.imageUrl}
                                        alt={material.type}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-4xl">
                                        ♻️
                                    </div>
                                )}
                                <span className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold uppercase tracking-wide text-gray-700 shadow-sm">
                                    {material.type}
                                </span>
                            </div>

                            <div className="p-5 flex-1 flex flex-col">
                                <h2 className="text-lg font-bold text-gray-800 mb-1 capitalize">
                                    {material.quantity}
                                </h2>
                                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                    {material.description}
                                </p>

                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        {material.createdAt?.seconds
                                            ? new Date(material.createdAt.seconds * 1000).toLocaleDateString()
                                            : "Reciente"}
                                    </span>

                                    {role === "centro" ? (
                                        <button
                                            onClick={async () => {
                                                const user = auth.currentUser;
                                                if (user.uid === material.userId) {
                                                    alert("No puedes contactarte a ti mismo.");
                                                    return;
                                                }

                                                try {
                                                    // 1. Check if chat exists (naive implementation: ID based on sorted UIDs)
                                                    const participantIds = [user.uid, material.userId].sort();
                                                    const chatId = `${participantIds[0]}_${participantIds[1]}`;

                                                    const chatRef = doc(db, "chats", chatId);
                                                    const chatSnap = await getDoc(chatRef);

                                                    if (!chatSnap.exists()) {
                                                        // Create new chat
                                                        // Note: We need publisher's name. For MVP we might not have it readily here 
                                                        // if it's not in the 'material' document. 
                                                        // Fallback: Use generic name or fetch. 
                                                        // BETTER: Store publisherName in material doc (we did that in PublishMaterial.jsx!)

                                                        const participantData = {
                                                            [user.uid]: { name: user.email /* For now default to email/name */, email: user.email },
                                                            [material.userId]: { name: material.userName || "Usuario", email: "..." }
                                                        };

                                                        await setDoc(chatRef, {
                                                            participants: participantIds,
                                                            participantsData: participantData,
                                                            lastMessage: `Hola, me interesa tu material: ${material.type}`,
                                                            lastMessageTime: serverTimestamp(),
                                                            createdAt: serverTimestamp()
                                                        });

                                                        // Add initial message
                                                        await addDoc(collection(db, "chats", chatId, "messages"), {
                                                            text: `Hola, me interesa tu material: ${material.type} (${material.quantity}). ¿Sigue disponible?`,
                                                            senderId: user.uid,
                                                            createdAt: serverTimestamp()
                                                        });
                                                    }

                                                    // Navigate to chat
                                                    window.location.href = `/chat/${chatId}`;

                                                } catch (error) {
                                                    console.error("Error al iniciar chat:", error);
                                                    alert("Error al iniciar chat.");
                                                }
                                            }}
                                            className="text-sm bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                        >
                                            <span>💬</span> Contactar
                                        </button>
                                    ) : (
                                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                            Disponible
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
