import React from 'react';
import {
    Box,
    Grid2,
} from "@mui/material";
import '../../Styles/SignIn&UpPage.css'
import logo from "../../assets/logos/fulllogo1.svg";
import {AppProvider} from "@toolpad/core/AppProvider";
import SignInTheme from "../../Styles/SignInTheme.jsx";
import UserForm from "../../Components/General/userForm.jsx";
import {useNavigate} from "react-router-dom";

const AdminSignInPage = () => {
    const navigate = useNavigate();
    return (
        <AppProvider theme={SignInTheme}>
            <div className="login-page-div" >
                <Grid2 className="login-page-grid">
                    <Box className="login-page-navbar">
                        <img
                            style={{ maxHeight: "100px", maxWidth: "500px", width: "100%", height: "auto", cursor: "pointer" }}
                            src={logo}
                            alt="Streambase"
                            onClick={() => navigate("/")}
                        />
                    </Box>

                    <UserForm isSignUp={false} isSignIn={true} isAdmin={true} />
                </Grid2>
            </div>
        </AppProvider>
    );
};

export default AdminSignInPage;