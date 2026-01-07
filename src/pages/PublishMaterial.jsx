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
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Publicar Material</h2>
                    <Link to="/dashboard" className="text-gray-500 hover:text-gray-700">✕</Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Material</label>
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            value={materialType}
                            onChange={(e) => setMaterialType(e.target.value)}
                        >
                            <option value="plastic">Plástico</option>
                            <option value="glass">Vidrio</option>
                            <option value="cardboard">Cartón / Papel</option>
                            <option value="metal">Metal</option>
                            <option value="electronics">Electrónicos</option>
                            <option value="other">Otro</option>
                        </select>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Aproximada</label>
                        <input
                            type="text"
                            placeholder="Ej: 2 bolsas grandes, 5kg..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Detalles</label>
                        <textarea
                            rows="3"
                            placeholder="Detalles adicionales para el recolector..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Foto del Material</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => setFile(e.target.files[0])}
                            />
                            {file ? (
                                <p className="text-green-600 font-medium">{file.name}</p>
                            ) : (
                                <p className="text-gray-500 text-sm">Toca para subir una foto</p>
                            )}
                        </div>
                    </div>

                    {/* Location Status */}
                    <div className="flex items-center gap-2 text-sm">
                        {fetchingLocation ? (
                            <span className="text-yellow-600">📍 Obteniendo ubicación...</span>
                        ) : location ? (
                            <span className="text-green-600">✅ Ubicación detectada</span>
                        ) : (
                            <button type="button" onClick={getLocation} className="text-blue-600 underline">
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
