import React, {useEffect, useState} from 'react';
import "../../Styles/footer.css";
import { Box, Typography} from "@mui/material";
import {Link, useNavigate} from 'react-router-dom';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import XIcon from '@mui/icons-material/X';
import tmdbLogo from '../../assets/logos/tmbd logo.svg';

const FooterLink = ({ text }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const userLoggedIn = localStorage.getItem('token');
        setIsLoggedIn(!!userLoggedIn);
    }, []);

    // Function to handle logo click based on login status
    const handleLogoClick = () => {
        if (isLoggedIn) {
            navigate('/home');
        } else {
            navigate('/');
        }
    };
    return (
        <Link
            className="footer-link"
            to={ handleLogoClick }
        >
            { text }
        </Link>
    )
}

const Footer = () => {
    return (
        <Box sx={{ textAlign: "left", ml: 15, mr: 15, mt: 5, py: 3, color: "secondary.main" }}>
            <div style={{ display: "flex", direction: "row", marginBottom: 15 }}>
                <div style={{ display: "flex", direction: "row", gap: "20px", width: "90%" }}>
                    <FooterLink text={ "Terms of Service" } />
                    <FooterLink text={ "Privacy Policy" } />
                    <FooterLink text={ "Accessibility" } />
                    <FooterLink text={ "Careers" } />
                    <FooterLink text={ "Advertise with us" } />
                    <FooterLink text={ "Help" } />
                </div>
                <div style={{ display: "flex", direction: "row", gap: "20px", width: "20%", justifyContent: "right", alignItems: "center" }}>
                    <InstagramIcon className={"footer-icon"} />
                    <XIcon className={"footer-icon"} />
                    <FacebookIcon className={"footer-icon"} />
                </div>
            </div>
            <div style={{ display: "flex", direction: "row", gap: "10px", paddingBottom: 10 }}>
                <Typography variant="caption" > Powered by  </Typography>
                <img src={tmdbLogo} alt="TMBD" style={{ maxHeight: "100px", maxWidth: "60px", cursor: "pointer"}} />
            </div>
            <Typography variant="caption">&copy; StreamBase Inc. All Rights Reserved.</Typography>
        </Box>
    );
};

export default Footer;