import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const useCheckBanStatus = (user) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/users/${user.id}`);
                const updatedUser = await response.json();

                if (updatedUser.suspended) {
                    // User is banned → Clear session & Redirect to log in
                    localStorage.removeItem("user");
                    sessionStorage.removeItem("user");

                    alert("Your account has been suspended. You have been logged out.");
                    navigate("/login");
                }
            } catch (error) {
                console.error("Error checking ban status:", error);
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [user, navigate]);
};

export default useCheckBanStatus;
