import React from 'react';
import CustomButton from "../../Components/General/customButton.jsx";
import Stack from "@mui/material/Stack";
import {useNavigate} from "react-router-dom";
import MovieSearchBar from "../../Components/General/movieSearchBar.jsx";

function HomePageToolBarActions () {
    const navigate = useNavigate();

    const handleSignIn = () => {
        navigate("/signin");
    }

    const handleSignUp = () => {
        navigate("/signup");
    }

    return (
        <Stack display={"flex"} flexDirection="row" gap={"10px"} paddingRight={"40px"} alignItems={"center"}>
            <MovieSearchBar width={"350px"} height={"40px"}/>
            <CustomButton backgroundColor={"rgba(50, 50, 50, 0.7)"} color={"white"} buttonLabel={"Sign In"} hoverColor={"rgba(50, 50, 50, 1)"} onClick={handleSignIn}/>
            <CustomButton buttonLabel={"Sign Up"} onClick={handleSignUp} />
        </Stack>
    );
}

export default HomePageToolBarActions;