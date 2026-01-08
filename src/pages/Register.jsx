import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/config";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";

function Register() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tipo, setTipo] = useState("reciclador");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      await setDoc(doc(db, "users", userCredential.user.uid), {
        nombre,
        email,
        tipo,
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      setError("Error al registrar usuario");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-6 rounded shadow w-80 transition-colors"
      >
        <div className="flex flex-col items-center mb-6">
          <img src="/icon_recyclo.jpeg" alt="Logo Reciclaje" className="w-24 h-24 rounded-full object-cover mb-4 shadow-md" />
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
            Registro
          </h2>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <input
          type="text"
          placeholder="Nombre"
          className="w-full mb-3 p-2 border rounded"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Correo"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Contraseña"
          className="w-full mb-3 p-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <select
          className="w-full mb-4 p-2 border rounded"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        >
          <option value="reciclador">
            Persona recicladora
          </option>
          <option value="centro">
            Centro / comprador
          </option>
        </select>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Registrarse
        </button>
      </form>
    </div>
  );
}

export default Register;
