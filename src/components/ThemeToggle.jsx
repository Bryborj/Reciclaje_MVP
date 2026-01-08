import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 shadow-sm border ${theme === "dark"
                    ? "bg-gray-800 text-yellow-300 border-gray-700 hover:bg-gray-700"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-100"
                }`}
            aria-label="Toggle Dark Mode"
        >
            {theme === "dark" ? "🌙" : "☀️"}
        </button>
    );
}
