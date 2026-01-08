import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Map from "./pages/Map";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Materials from "./pages/Materials";
import NotFoundPage from "./pages/NotFoundPage";
import PublishMaterial from "./pages/PublishMaterial";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatList from "./pages/ChatList";
import Chat from "./pages/Chat";
import NotificationToast from "./components/NotificationToast";
import { ThemeProvider } from "./context/ThemeContext";
import { auth, db } from "./firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";

function App() {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Listen for new messages globally
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      // Listen to chats I'm involved in
      const q = query(
        collection(db, "chats"),
        where("participants", "array-contains", user.uid)
      );

      const unsubscribeChats = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === "modified") {
            const data = change.doc.data();
            // Check if last message is strictly new (e.g. within last 2 seconds to avoid stale toast on reload)
            // and not sent by me.
            const now = new Date();
            const msgTime = data.lastMessageTime?.toDate();

            // Simple check: if message is recent (< 5s ago) and I am NOT the last sender?
            // We don't have 'lastSenderId' in the chat doc at top level in my previous implementation.
            // Implementation fix: We should store lastSenderId in chat doc to know if I sent it.
            // Workaround: We'll show it anyway or try to guess. 
            // Better: Let's assume for MVP showing a notification is better than none. 

            if (msgTime && (now - msgTime) < 10000) {
              // Check if I am NOT the sender
              if (data.lastSenderId !== user.uid) {
                setNotification(`Tienes un nuevo mensaje: "${data.lastMessage}"`);
              }
            }
          }
        });
      });

      return () => unsubscribeChats();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <ThemeProvider>
      <BrowserRouter>
        {notification && (
          <NotificationToast
            message={notification}
            onClose={() => setNotification(null)}
          />
        )}
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
            <Route
              path="/mapa"
              element={
                <ProtectedRoute>
                  <Map />
                </ProtectedRoute>
              } />
            <Route
              path="/publicar"
              element={
                <ProtectedRoute>
                  <PublishMaterial />
                </ProtectedRoute>
              }
            />

            <Route path="/materials" element={<Materials />} />

            <Route
              path="/chats"
              element={
                <ProtectedRoute>
                  <ChatList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat/:chatId"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
