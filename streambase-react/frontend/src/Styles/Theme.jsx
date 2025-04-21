import {createTheme} from "@mui/material/styles";

const Theme = createTheme({
    palette: {
        mode: "dark",
        secondary: {
            main: "#c3c0c0",
            light: "#fff",
            dark: "#595757",
            contrastText: '#D32F2F',
        },
        primary: {
            main: '#FEB508',
            light: '#FACA10',
            dark: '#e6a102',
            contrastText: '#070501',
        },
        tertiary: {
            main: '#D32F2F',
            light: '#FF5B5B',
            dark: '#9A0007',
        },
        background: {
            default: '#070501',
            paper: '#070501',
            light: 'rgba(51, 51, 51, 0.1)',
            lighter: 'rgba(51, 51, 51, 0.5)',
        },
        text: {
            primary: '#FFFFFF',
            secondary: '#B0B0B0',
        },
        // Optionally, you can add other colors like error, success, etc.
        error: {
            main: '#D32F2F',
        },
        success: {
            main: '#4CAF50',
        },
    },
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: { light: false, dark: true },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
    typography: {
        fontFamily: "Quicksand"
    },
    components: {
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    borderColor: "#070501",
                },
            },
        },
    },
});

export default Theme;