import React, {createContext, useState} from 'react';

export const darkContext = createContext();

const DarkProvider = ({children}) => {
    const [isDark, setIsDark] = useState("light");
    const toggleDark = () => {
        setIsDark(isDark === "light" ? "dark" : "light");
    };
    return (
        <darkContext.Provider value={{ isDark, toggleDark }}>
            {children}
        </darkContext.Provider>
    );
};

export default DarkProvider;
//layout taken from https://dev.to/sanspanic/implementing-dark-mode-in-react-via-context-4f1p