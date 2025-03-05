import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import CodeEditor from "@/components/code-editor";
import FileDirectory from "./components/file-directory";

interface User {
    id: number;
    email: string;
    name: string;
    picture: string;
}

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Access environment variable using import.meta.env
    const googleClientId = '567486587529-l6hcg54t7jkdi4rj8ulk0ngv36gtud8l.apps.googleusercontent.com';
    if (!googleClientId) {
        throw new Error("Google Client ID is missing in environment variables.");
    }

    const handleLoginSuccess = async (credentialResponse: any) => {
        try {
            const response = await fetch('http://localhost:3001/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: credentialResponse.credential }),
            });

            if (!response.ok) {
                throw new Error('Failed to log in');
            }

            const user = await response.json();
            setUser(user);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Error during login:', error);
        }
    };

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        setIsAuthenticated(false);
    };

    const handleFileSelect = (fileId: number) => {
        console.log("File selected:", fileId);
    };

    return (
        <GoogleOAuthProvider clientId={googleClientId}>
            {isAuthenticated && user ? (
                <div className="flex h-screen bg-neutral-900">
                    <FileDirectory userId={user.id} onFileSelect={handleFileSelect} />
                    <div className="flex-1">
                        <CodeEditor userId={user.id} handleLogout={handleLogout} />
                    </div>
                </div>
            ) : (
                <div className="h-screen flex flex-col items-center justify-center bg-neutral-900 text-white">
                    <h1 className="text-3xl font-semibold text-center mb-4">
                        Welcome to <span className="text-red-500">Salvage</span> Text Editor
                    </h1>
                    <p className="text-lg text-center mb-6">
                        A sophisticated platform for efficient code writing, editing, and transpiling.
                    </p>
                    <p className="text-center text-sm mb-4">
                        Please log in to continue and explore the power of Salvage.
                    </p>
                    <div className="text-white py-3 px-8 rounded-lg border-2 border-white hover:bg-white hover:text-black transition">
                        <GoogleLogin
                            onSuccess={handleLoginSuccess}
                            onError={() => console.log("Login Failed")}
                            useOneTap
                        />
                    </div>
                </div>
            )}
        </GoogleOAuthProvider>
    );
};

export default App;