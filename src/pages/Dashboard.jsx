import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import ThemeToggle from "../components/ThemeToggle";

function Dashboard() {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setUserData(docSnap.data());
            }
        };

        fetchUser();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        window.location.href = "/";
    };

    if (!userData) {
        return <p className="p-4">Cargando...</p>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <header className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <img src="/icon_recyclo.jpeg" alt="Logo" className="w-12 h-12 rounded-full object-cover shadow-sm border-2 border-green-500" />
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Hola, <span className="text-green-600">{userData.nombre}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={handleLogout}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </header>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Tu Panel de Control</h2>

                {userData.tipo === "reciclador" ? (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                Tienes materiales reciclables? Publícalos para que los centros de acopio puedan encontrarlos.
                            </p>
                            <div className="flex flex-col space-y-3">
                                <Link
                                    to="/publicar"
                                    className="text-center bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
                                >
                                    <span>♻️</span> Publicar Material
                                </Link>
                                <Link
                                    to="/mapa"
                                    className="text-center border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    📍 Ver Centros Cercanos
                                </Link>
                                <Link
                                    to="/chats"
                                    className="text-center border-2 border-gray-600 text-gray-600 dark:text-gray-300 dark:border-gray-500 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    💬 Mis Mensajes
                                </Link>
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg flex items-center justify-center">
                            <span className="text-green-800 dark:text-green-400 font-medium">✨ Contribuye al planeta hoy</span>
                        </div>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                Encuentra materiales reciclables cercanos a tu ubicación para recolectar.
                            </p>
                            <div className="flex flex-col space-y-3">
                                <Link
                                    to="/mapa"
                                    className="text-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                                >
                                    🗺️ Ver Mapa de Recolección
                                </Link>
                                <Link
                                    to="/materials"
                                    className="text-center border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    📋 Lista de Materiales
                                </Link>
                                <Link
                                    to="/chats"
                                    className="text-center border-2 border-gray-600 text-gray-600 dark:text-gray-300 dark:border-gray-500 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium"
                                >
                                    💬 Mis Mensajes
                                </Link>
                            </div>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-center justify-center">
                            <span className="text-blue-800 dark:text-blue-400 font-medium">🚛 Gestiona tus recolecciones</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}

export default Dashboard;