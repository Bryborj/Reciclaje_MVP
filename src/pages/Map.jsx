import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "react-router-dom";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "../firebase/config";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icons in Vite/Webpack
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const materialIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  resultsShadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png"
});

const centerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  resultsShadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png"
});


function Map() {
  const [materials, setMaterials] = useState([]);

  // Centros simulados (MVP)
  const centros = [
    { id: 1, nombre: "Comercializadora Century Recycling", lat: 18.901, lng: -97.460, link: "https://maps.app.goo.gl/qz3im7fpDLiUpzxeA" },
    { id: 2, nombre: "Recicladora palmarito", lat: 18.90686, lng: -97.63050, link: "https://maps.app.goo.gl/2GNEaJG9PUZ6Ji6CA" },
    { id: 3, nombre: "Reciclados AMAIB", lat: 18.90114, lng: -97.66701, link: "https://maps.app.goo.gl/qLFub1twjtrGoUyw6" },
    { id: 4, nombre: "Recuperadora Industrial", lat: 18.87215, lng: -97.71610, link: "https://maps.app.goo.gl/FvVxHL9u6H8jtkBt7" },
    { id: 5, nombre: "Eco Planet", lat: 18.88896, lng: -97.73186, link: "https://maps.app.goo.gl/3gnNav6waQRbSZC87" },
    { id: 6, nombre: "Recicladora Palmarito Sucursal Quecholac", lat: 18.95820, lng: -97.67784, link: "https://maps.app.goo.gl/UAdcTrCdC5fYBzYU6" }
  ];

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const q = query(collection(db, "materials"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(m => m.location && m.location.lat && m.location.lng); // Ensure valid location
        setMaterials(data);
      } catch (error) {
        console.error("Error fetching materials for map:", error);
      }
    };

    fetchMaterials();
  }, []);

  return (
    <div className="relative h-screen w-full">
      {/* Back Button Overlay */}
      <div className="absolute top-4 left-4 z-[9999]">
        <Link
          to="/dashboard"
          className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md font-bold text-gray-700 dark:text-gray-200 hover:text-green-600 dark:hover:text-green-400 transition"
        >
          ← Volver al Panel
        </Link>
      </div>

      <div className="absolute top-4 right-4 z-[9999] bg-white dark:bg-gray-800 p-3 rounded-lg shadow-md space-y-2 text-sm text-gray-800 dark:text-gray-200">
        <div className="flex items-center gap-2">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" className="w-4 h-6" />
          <span>Materiales (Usuarios)</span>
        </div>
        <div className="flex items-center gap-2">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" className="w-4 h-6" />
          <span>Centros de Acopio</span>
        </div>
      </div>

      <MapContainer
        center={[18.90686, -97.63050]}
        zoom={11}
        className="h-full w-full"
      /* 
         Simple Dark Mode hack for OSM Tiles:
         invert colors and rotate hue to bring some colors back to normal-ish.
         Note: This inverts everything including markers, so we might need to be careful.
         Ideally, we use a different TileLayer for dark mode, but for MVP this css filter on the tile pane is a common trick.
         However, applying it to MapContainer applies it to everything.
         Better approach: Apply unique class to TileLayer.
         But React-Leaflet doesn't pass className easily to the img tiles without custom panes.
         Let's try a CSS based solution targeting `.leaflet-tile-pane` in global css or module.
         
         For simplicity in inline styles, we can stick to this or just accept light map.
         Let's try to pass className to TileLayer if supported or wrap it.
         Actually, the "dark" class on the parent div can be used to style `.leaflet-layer` via CSS.
      */
      >
        <TileLayer
          attribution="© OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />

        {/* ... Markers ... */}
        {/* Note: If we invert the whole map, markers look bad. 
            We should only invert the tiles. 
            The easy way is adding a <style> block or using Global CSS.
            Let's add a style tag here for the MVP "dark map" effect.
        */}
        <style>{`
            .dark .map-tiles {
                filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
            }
        `}</style>


        {/* Render Centers */}
        {centros.map((centro) => (
          <Marker key={`center-${centro.id}`} position={[centro.lat, centro.lng]} icon={centerIcon}>
            <Popup className="custom-popup">
              <div className="font-sans">
                <h3 className="font-bold text-blue-800">{centro.nombre}</h3>
                <p className="text-xs text-gray-500 mb-2">Centro de Acopio Verificado</p>
                <a
                  href={centro.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                >
                  Cómo llegar con Google Maps
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Render Materials */}
        {materials.map((m) => (
          <Marker key={`mat-${m.id}`} position={[m.location.lat, m.location.lng]} icon={materialIcon}>
            <Popup className="custom-popup">
              <div className="font-sans min-w-[200px]">
                {m.imageUrl && (
                  <img src={m.imageUrl} alt={m.type} className="w-full h-24 object-cover rounded mb-2" />
                )}
                <h3 className="font-bold text-green-700 capitalize">{m.type}</h3>
                <p className="text-sm font-medium text-gray-800">{m.quantity}</p>
                <p className="text-xs text-gray-600 mt-1">{m.description}</p>
                <p className="text-xs text-gray-400 mt-2">Publicado el {new Date(m.createdAt?.seconds * 1000).toLocaleDateString()}</p>

                <button
                  onClick={async () => {
                    // Important: auth might not be imported or initialized in this scope nicely without useEffect or props.
                    // But since `auth` is exported from firebase/config, we can import it.
                    // NOTE: In React Leaflet Popups, onClick events can be tricky because they are rendered inconsistently outside React's event loop sometimes.
                    // However, standard onClick usually works in modern versions. 
                    // Alternative: using a global function or Link if navigation is simple. 
                    // Let's try direct logic.

                    const user = auth.currentUser;
                    if (!user) {
                      alert("Debes iniciar sesión para contactar.");
                      return;
                    }

                    if (user.uid === m.userId) {
                      alert("Es tu propio material.");
                      return;
                    }

                    try {
                      const participantIds = [user.uid, m.userId].sort();
                      const chatId = `${participantIds[0]}_${participantIds[1]}`;

                      // We'll just navigate to the chat ID. 
                      // If it doesn't exist, Chat.jsx creates it? No, Materials.jsx created it.
                      // Chat.jsx expects it to exist OR handles it?
                      // Current Chat.jsx implementation redirects if not found.
                      // So we MUST create it if it doesn't exist.

                      // Ideally this logic should be a shared utility function `startChat(user, targetUser, materialMsg)`.
                      // For MVP, duplicating the check here.

                      const { doc, getDoc, setDoc, addDoc, serverTimestamp, collection } = await import("firebase/firestore");
                      const chatRef = doc(db, "chats", chatId);
                      const chatSnap = await getDoc(chatRef);

                      if (!chatSnap.exists()) {
                        const participantData = {
                          [user.uid]: { name: user.email, email: user.email },
                          [m.userId]: { name: m.userName || "Usuario", email: "..." }
                        };

                        await setDoc(chatRef, {
                          participants: participantIds,
                          participantsData: participantData,
                          lastMessage: `Hola, vi tu ubicación de: ${m.type}`,
                          lastMessageTime: serverTimestamp(),
                          createdAt: serverTimestamp(),
                          lastSenderId: user.uid
                        });

                        await addDoc(collection(db, "chats", chatId, "messages"), {
                          text: `Hola, encontré tu ${m.type} en el mapa. ¿Está disponible?`,
                          senderId: user.uid,
                          createdAt: serverTimestamp()
                        });
                      }

                      // Redirect
                      window.location.href = `/chat/${chatId}`;

                    } catch (e) {
                      console.error(e);
                      alert("Error al contactar");
                    }
                  }}
                  className="mt-2 w-full bg-green-600 text-white text-xs py-2 px-2 rounded hover:bg-green-700 transition"
                >
                  💬 Contactar Reciclador
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default Map;
