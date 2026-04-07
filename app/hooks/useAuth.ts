import { useState } from "react";
import { useEffect } from "react";

export default function useAuth() {
    const [isLoggedIn, setIsLoggedIn] = useState(false); //dla stanu zalogowania

    useEffect(() => {
        //wyciągamy token z localstorage
        const token = localStorage.getItem("token");

        //zmiana na true jeśli token istnieje
        if (token) {
        setIsLoggedIn(true);
        }
    }, []);

    const handleLogout = () => {
    // 1. Czyścimy schowek - usuwamy token i dane usera
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 2. Odświeżamy stronę, aby React zauważył zmianę i wyrzucił nas do logowania
    window.location.href = "/login";
    };

    return { isLoggedIn, handleLogout };
}