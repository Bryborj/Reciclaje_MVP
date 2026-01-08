import { useState, useEffect } from "react";
import { db, auth } from "../firebase/config";
import { supabase } from "../supabase/supabaseClient";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function PublishMaterial() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Form State
    const [materialType, setMaterialType] = useState("plastic");
    const [quantity, setQuantity] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);

    // Location State
    const [location, setLocation] = useState(null);
    const [fetchingLocation, setFetchingLocation] = useState(false);

    useEffect(() => {
        // Get user location automatically on load
        getLocation();
    }, []);

    const getLocation = () => {
        setFetchingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setFetchingLocation(false);
                },
                (error) => {
                    console.error("Error getting location", error);
                    setFetchingLocation(false);
                    alert("No pudimos obtener tu ubicación. Por favor actívala para que los recolectores puedan encontrarte.");
                }
            );
        } else {
            setFetchingLocation(false);
            alert("Geolocalización no soportada en este navegador.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            alert("Por favor sube una foto del material.");
            return;
        }
        if (!location) {
            alert("Necesitamos tu ubicación para publicar.");
            getLocation();
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;
            if (!user) {
                alert("Debes iniciar sesión");
                navigate("/");
                return;
            }

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.uid}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("materials")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data } = supabase.storage
                .from("materials")
                .getPublicUrl(fileName);

            const fileURL = data.publicUrl;

            // 3. Save to Firestore
            await addDoc(collection(db, "materials"), {
                userId: user.uid,
                userName: user.displayName || "Usuario", // In case we add display names later
                type: materialType,
                quantity,
                description,
                imageUrl: fileURL,
                location,
                status: "available",
                createdAt: serverTimestamp(),
            });

            alert("¡Material publicado con éxito!");
            navigate("/dashboard");

        } catch (error) {
            console.error(error);
            alert("Error al publicar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link to="/dashboard" className="p-2 bg-white dark:bg-slate-800 rounded-full shadow text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition">
                    ←
                </Link>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Publicar Material</h1>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Material Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Material</label>
                        <select
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white"
                        >
                            <option value="plastic">Plástico</option>
                            <option value="cardboard">Cartón</option>
                            <option value="glass">Vidrio</option>
                            <option value="metal">Metal</option>
                            <option value="paper">Papel</option>
                            <option value="electronics">Electrónicos</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad Aproximada</label>
                        <input
                            type="text"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Ej: 2 bolsas grandes, 5kg"
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 text-gray-800 dark:text-white"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Detalles adicionales (opcional)..."
                            className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none text-gray-800 dark:text-white"
                        />
                    </div>

                    {/* File Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Foto del Material</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 dark:file:bg-slate-700 dark:file:text-green-400"
                            required
                        />
                    </div>

                    {/* Location Status */}
                    <div className="flex items-center gap-2 text-sm">
                        {fetchingLocation ? (
                            <span className="text-yellow-600">📍 Obteniendo ubicación...</span>
                        ) : location ? (
                            <span className="text-green-600">✅ Ubicación detectada</span>
                        ) : (
                            <button type="button" onClick={getLocation} className="text-blue-600 dark:text-blue-400 underline">
                                Reintentar obtener ubicación
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !location}
                        className={`w-full py-3 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] ${loading || !location ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 shadow-md'
                            }`}
                    >
                        {loading ? "Publicando..." : "Publicar Ahora"}
                    </button>
                </form>
            </div>
        </div>
    );
}
