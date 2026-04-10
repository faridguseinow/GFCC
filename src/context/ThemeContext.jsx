import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {

    const [theme, setTheme] = useState(
        localStorage.getItem("theme") || "light-theme"
    );

    useEffect(() => {
        const body = document.body;

        // Добавляем класс анимации
        body.classList.add("theme-blur");

        // Меняем тему через небольшой тайминг
        setTimeout(() => {
            body.classList.remove("light-theme", "dark-theme");
            body.classList.add(theme);
            localStorage.setItem("theme", theme);
        }, 120);

        // Убираем blur
        setTimeout(() => {
            body.classList.remove("theme-blur");
        }, 450);

    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev =>
            prev === "light-theme" ? "dark-theme" : "light-theme"
        );
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}