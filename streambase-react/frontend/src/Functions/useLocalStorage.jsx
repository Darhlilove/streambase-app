import { useState, useEffect } from "react";

export const useLocalStorage = (key) => {
    const readValue = () => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error);
            return null;
        }
    };

    const [value, setValue] = useState(readValue());

    const setLocalStorageValue = (newValue) => {
        try {
            const valueToStore = typeof newValue === "function" ? newValue(readValue()) : newValue;
            localStorage.setItem(key, JSON.stringify(valueToStore));
            setValue(valueToStore);
        } catch (error) {
            console.error(`Error setting localStorage key "${key}":`, error);
        }
    };

    useEffect(() => {
        const handleStorageChange = (event) => {
            if (event.key === key) {
                setValue(readValue());
            }
        };

        window.addEventListener("storage", handleStorageChange);

        // Detect same-tab changes with polling
        const interval = setInterval(() => {
            const latest = readValue();
            setValue((prev) => {
                const prevStr = JSON.stringify(prev);
                const latestStr = JSON.stringify(latest);
                return prevStr !== latestStr ? latest : prev;
            });
        }, 1000); // Check every second

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            clearInterval(interval);
        };
    }, [key]);

    return [value, setLocalStorageValue];
};
