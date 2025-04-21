import {createTheme} from "@mui/material/styles";

const SignInTheme = createTheme({
    palette: {
        primary: {
            main: "#e6a102",
        },
        background: {
            default: "#070501",
            paper: "rgba(30, 30, 30, 1)",
        },
        text: {
            primary: "#ffffff",
            secondary: "rgba(255, 255, 255, 0.7)",
        },
    },
    components: {
        MuiDialog: {
            styleOverrides: {
                paper: {
                    width: "100%",
                    height: "100%",
                    backgroundColor: "transparent",
                    boxShadow: "none",
                },
            },
        },
        MuiOutlinedInput: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.5)", // Grey border for inputs
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255, 255, 255, 0.8)", // Brighter on hover
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#ffffff", // Blue when focused
                    },
                    color: "rgba(255, 255, 255, 0.8)",
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: "24px",
                    padding: "10px 16px",
                    textTransform: "uppercase !important",
                    fontWeight: "600",
                    transition: "all 0.3s ease-in-out",
                    "&.Mui-disabled": {
                        backgroundColor: "#FEB508",
                        color: "white",
                        cursor: "not-allowed",
                    },
                },
                containedPrimary: {
                    backgroundColor: "#FEB508",
                    "&:hover": {
                        backgroundColor: "#e6a102",
                    },
                },
                outlinedPrimary: {
                    borderColor: "#FEB508",
                    color: "inherit",
                    "&:hover": {
                        backgroundColor: "rgba(144, 202, 249, 0.1)",
                    },
                },
            },
        },
    },
    typography: {
        fontFamily: "Quicksand"
    },
});

export default SignInTheme;