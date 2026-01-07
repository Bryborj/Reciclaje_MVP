import { useState, useEffect } from "react";

export default function NotificationToast({ message, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="fixed top-4 right-4 z-50 bg-white border-l-4 border-green-500 shadow-lg rounded-r p-4 flex items-center animate-bounce-in">
            <div className="mr-3">
                <span className="text-2xl">💬</span>
            </div>
            <div>
                <p className="font-bold text-gray-800">Nuevo Mensaje</p>
                <p className="text-sm text-gray-600 max-w-xs truncate">{message}</p>
            </div>
            <button
                onClick={onClose}
                className="ml-4 text-gray-400 hover:text-gray-600 font-bold"
            >
                ×
            </button>
        </div>
    );
}
