import React from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";

const DeleteAccountDialog = ({ open, onClose, onDelete }) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogContent>
                <p>Are you sure you want to delete your account? This action is irreversible.</p>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        onDelete();
                        onClose();
                    }}
                    color="secondary"
                >
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteAccountDialog;
