import React, {useEffect, useState} from 'react';
import Dashboard from "../Dashboard/Dashboard.jsx";
import HomePageToolBarActions from "./homePageToolBarActions.jsx";
import {useNavigate} from "react-router-dom";

const Homepage = () => {
    const navigate = useNavigate();
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
            navigate("/home");
        } else {
            setCheckingAuth(false);
        }
    }, [navigate]);

    if (checkingAuth) return null;

    return (
        <div>
            <Dashboard toolbarActions={HomePageToolBarActions}/>
        </div>
    );
};

export default Homepage;