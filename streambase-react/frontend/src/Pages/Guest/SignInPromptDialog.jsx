import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

const SignInPromptDialog = ({ open, handleClose, onSignIn, onCreateAccount }) => {
    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogContent>
                <Typography variant="body1">
                    You need to sign in or create an account to view movie details.
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onSignIn} color="primary" variant="contained">
                    Sign In
                </Button>
                <Button onClick={onCreateAccount} color="secondary" variant="outlined">
                    Create Account
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SignInPromptDialog;
