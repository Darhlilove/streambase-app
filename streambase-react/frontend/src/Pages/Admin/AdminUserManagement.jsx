import React, { useEffect, useState } from "react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Dialog,
    DialogTitle, DialogActions, CircularProgress, Tooltip, Grid, TablePagination, Typography, Box
} from "@mui/material";
import {Delete, Block, AdminPanelSettings, ArrowDownward, ArrowUpward} from "@mui/icons-material";
import { updateProfile, deleteProfile } from "../../Functions/handeUserAccountRequests.jsx";
import Stack from "@mui/material/Stack";
import {FilterButton} from "./AdminMovieRequestsContents.jsx";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const API_URL = import.meta.env.VITE_API_URL;

const SortBy = ({handleSort, a, b}) => {
    return (
        <>
            <IconButton onClick={() => handleSort(a)}>
                <ArrowDownward
                    sx={{
                        color: "#807e7e",
                        fontSize: "18px",
                        cursor: "pointer",
                        transition: "color 0.3s ease, transform 0.3s ease",
                        "&:hover": {
                            color: "#FEB508",
                            transform: "scale(1.2)",
                        },
                    }}
                />
            </IconButton>

            <IconButton onClick={() => handleSort(b)}>
                <ArrowUpward
                    sx={{
                        color: "#807e7e",
                        fontSize: "18px",
                        cursor: "pointer",
                        transition: "color 0.3s ease",
                        "&:hover": {
                            color: "#FEB508",
                            transform: "scale(1.2)",
                        },
                    }}
                />
            </IconButton>
        </>
    );
};

const AdminUsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [actionType, setActionType] = useState("");
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        fetchUsers();
    }, []);

    // Apply filtering when `users` or `activeFilter` changes
    useEffect(() => {
        if (!users || users.length === 0) {
            setFilteredUsers([]); // Prevent issues with empty data
            return;
        }

        let updatedUsers = [...users];

        if (activeFilter !== "all") {
            if (activeFilter === "active") {
                updatedUsers = updatedUsers.filter(user => !user.suspended);
            }
            if (activeFilter === "suspended") {
                updatedUsers = updatedUsers.filter(user => user.suspended);
            }
            if (activeFilter === "user") {
                updatedUsers = updatedUsers.filter(user => !user.privilege);
            }
            if (activeFilter === "admin") {
                updatedUsers = updatedUsers.filter(user => user.privilege);
            }
        }

        setFilteredUsers(updatedUsers);
    }, [users, activeFilter]);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/users`);
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (user) => {
        try {
            await deleteProfile(user.id, "users");
            setUsers(users.filter((u) => u.id !== user.id));
        } catch (error) {
            console.error("Error deleting user:", error);
        }
        setOpenDialog(false);
    };

    const handleSuspend = async (user) => {
        try {
            const updatedUser = { ...user, suspended: true };
            await updateProfile(user.id, updatedUser, "users");
            setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
        } catch (error) {
            console.error("Error suspending user:", error);
        }
        setOpenDialog(false);
    };

    const handleReinstate = async (user) => {
        try {
            const updatedUser = { ...user, suspended: null };
            await updateProfile(user.id, updatedUser, "users");
            setUsers(users.map((u) => (u.id === user.id ? updatedUser : u)));
        } catch (error) {
            console.error("Error suspending user:", error);
        }
        setOpenDialog(false);
    };

    const handlePromoteToAdmin = async (user) => {
        try {
            const newAdmin = { ...user, privilege: 1 };
            await fetch(`${API_URL}/users/${user.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({...newAdmin}),
            });

            setUsers(users.map((a) => (a.id === user.id ? newAdmin : a)));
        } catch (error) {
            console.error("Error promoting user:", error);
        }
        setOpenDialog(false);
    };

    const handleRevokeAccess = async (admin) => {
        try {
            const updatedAdmin = { ...admin, privilege: null };
            await fetch(`${API_URL}/users/${admin.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedAdmin),
            });

            setUsers(users.map((a) => (a.id === admin.id ? updatedAdmin : a)));
        } catch (error) {
            console.error("Error revoking admin access:", error);
        }
        setOpenDialog(false);
    };

    const handleChangePrivilege = async (admin, newPrivilege) => {
        try {
            const updatedAdmin = { ...admin, privilege: newPrivilege };
            await fetch(`${API_URL}/users/${admin.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedAdmin),
            });

            setUsers(users.map((a) => (a.id === admin.id ? updatedAdmin : a)));
        } catch (error) {
            console.error("Error updating admin privilege:", error);
        }
        setOpenDialog(false);
    };

    const handleDialogOpen = (user, type) => {
        setSelectedUser(user);
        setActionType(type);
        setOpenDialog(true);
    };

    const handleDialogConfirm = () => {
        if (actionType === "delete") handleDelete(selectedUser);
        if (actionType === "suspend") handleSuspend(selectedUser);
        if (actionType === "reinstate") handleReinstate(selectedUser);
        if (actionType === "promoteToAdmin") handlePromoteToAdmin(selectedUser);
        if (actionType === "revoke") handleRevokeAccess(selectedUser);
        if (actionType === "promote") handleChangePrivilege(selectedUser, 2);
        if (actionType === "demote") handleChangePrivilege(selectedUser, 1);
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleSortByUserStatus = (status) => {
        const sortedUsers = [...users].sort((a, b) => {
            const suspendedA = a.suspended === true ? 1 : 0;
            const suspendedB = b.suspended === true ? 1 : 0;

            if (status === "suspended") {
                return suspendedB - suspendedA; // Suspended users first
            } else if (status === "active") {
                return suspendedA - suspendedB; // Active users first
            }
            return a.name.localeCompare(b.name); // Default: Sort alphabetically
        });

        setFilteredUsers(sortedUsers);
    };

    const handleSortByName = (order) => {
        const sortedRequests = [...users].sort((a, b) =>
            order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
        );

        setFilteredUsers(sortedRequests);
    };

    const handleSortByPrivilege = (order) => {
        const sortedRequests = [...users].sort((a, b) => {
            const privilegeA = a.privilege ?? -1; // Assign -1 if null
            const privilegeB = b.privilege ?? -1; // Assign -1 if null

            return order === "asc"
                ? privilegeA - privilegeB  // Sort Low to High (null at bottom)
                : privilegeB - privilegeA; // Sort High to Low (null at bottom)
        });

        setFilteredUsers(sortedRequests);
    };

    const handleFilter  = (filter) => {
        setActiveFilter(filter);
    }

    return (
        <Grid item xs={12} sm={12} md={6} sx={{ marginTop: "20px", marginBottom: "20px", height: "100%", width: "100%",
            paddingY: "20px", paddingX: "40px" }}>
            <Box sx={{ display: 'flex', position: "sticky", top: 0, zIndex: 1000, justifyContent: 'space-between',
                alignItems: 'flex-end', mb: "20px", backgroundColor: "#070501", paddingBottom: "30px"}}>
                <Typography variant="h4" fontWeight={"bold"} component="div">
                    User Management
                </Typography>
                <Stack direction="row" spacing={2}>
                    <FilterButton title={"Active"} handleFilter={() => handleFilter("active")}
                                  isActive={activeFilter === "active"}
                    />
                    <FilterButton title={"Suspended"} handleFilter={() => handleFilter("suspended")}
                                  isActive={activeFilter === "suspended"}
                    />
                    <FilterButton title={"Users"} handleFilter={() => handleFilter("user")}
                                  isActive={activeFilter === "user"}
                    />
                    <FilterButton title={"Admin"} handleFilter={() => handleFilter("admin")}
                                  isActive={activeFilter === "admin"}
                    />
                    <FilterButton title={"All"} handleFilter={() => handleFilter("all")}
                                  isActive={activeFilter === "all"}
                    />
                </Stack>
            </Box>
            {loading ? <CircularProgress /> : (
                <Grid item xs={12} sm={12} md={6} sx={{ marginTop: "20px", marginBottom: "20px", height: "100%", width: "100%",
                    paddingY: "20px", paddingX: "40px" }}
                >
                    <TableContainer TableContainer sx={{ maxHeight: "700px", overflowY: "auto" }}>
                        <Table aria-label="simple table" stickyHeader sx={{ width: '100%', height: "100%", alignItems: 'center',
                            justifyContent: 'space-between', zIndex: 100 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>
                                        Name
                                        <SortBy handleSort={handleSortByName} a={"asc"} b={"desc"} />
                                    </TableCell>
                                    <TableCell align={"center"} sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>Email</TableCell>
                                    <TableCell align={"center"} sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>Password</TableCell>
                                    <TableCell align={"center"} sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>
                                        Status
                                        <SortBy handleSort={handleSortByUserStatus} a={"active"} b={"suspended"} />
                                    </TableCell>
                                    <TableCell align={"center"} sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>
                                        Platform Privilege
                                        <SortBy handleSort={handleSortByPrivilege} a={"asc"} b={"desc"} />
                                    </TableCell>
                                    <TableCell align={"center"} sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell sx={{ fontSize: "16px"}}>{user.name}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "16px"}}>{user.email}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "16px"}}>{user.password || "No password set"}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "16px"}}>{user.suspended ? "Suspended" : "Active"}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "16px"}}>{user.privilege ? "Admin " + user.privilege : "User"}</TableCell>
                                        <TableCell align="center" sx={{ fontSize: "16px"}}>
                                            {
                                                <>
                                                    {
                                                        user.suspended ? (
                                                            <Tooltip title={user.privilege ? "Reinstate Admin" : "Reinstate User"} placement="top">
                                                                <IconButton onClick={() => handleDialogOpen(user, "reinstate")}
                                                                            color="success">
                                                                    <CheckCircleIcon/>
                                                                </IconButton>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip title={user.privilege ? "Suspend Admin" : "Suspend User"} placement="top">
                                                                <IconButton onClick={() => handleDialogOpen(user, "suspend")}
                                                                            color="warning">
                                                                    <Block/>
                                                                </IconButton>
                                                            </Tooltip>
                                                        )
                                                    }
                                                    {
                                                        !user.privilege ?
                                                        <>
                                                            <Tooltip title="Delete User" placement="top">
                                                                <IconButton onClick={() => handleDialogOpen(user, "delete")}
                                                                            color="error">
                                                                    <Delete/>
                                                                </IconButton>
                                                            </Tooltip>

                                                            <Tooltip title="Promote to Admin" placement="top">
                                                                <IconButton
                                                                    onClick={() => handleDialogOpen(user, "promoteToAdmin")}
                                                                    sx={{color: "#228df3"}}>
                                                                    <AdminPanelSettings/>
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                        :
                                                        <>
                                                            <Tooltip title="Revoke Admin Access" placement={"top"}>
                                                                <IconButton onClick={() => handleDialogOpen(user, "revoke")}
                                                                            color="error">
                                                                    <Delete/>
                                                                </IconButton>
                                                            </Tooltip>

                                                            {
                                                                user.privilege === 2 && (
                                                                    <Tooltip title="Demote to Level 1" placement={"top"}>
                                                                        <IconButton
                                                                            onClick={() => handleDialogOpen(user, "demote")}
                                                                            color="warning">
                                                                            <AdminPanelSettings/>
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}

                                                            {user.privilege === 1 && (
                                                                <Tooltip title="Promote to Level 2" placement={"top"}>
                                                                    <IconButton
                                                                        onClick={() => handleDialogOpen(user, "promote")}
                                                                        sx={{color: "#228df3"}}>
                                                                        <AdminPanelSettings/>
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </>
                                                    }
                                                </>
                                            }

                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[20, 50, 100]}
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                        }}
                        component="div"
                        count={users.length}
                        rowsPerPage={Math.min(rowsPerPage || users.length)}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Grid>
            )}

            {/* Confirmation Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle fontSize={"18px"}>
                    {actionType === "delete" && `Are you sure you want to delete ${selectedUser?.name}?`}
                    {actionType === "suspend" && `Suspend ${selectedUser?.name}?`}
                    {actionType === "reinstate" && `Reinstate ${selectedUser?.name}?`}
                    {actionType === "promoteToAdmin" && `Make ${selectedUser?.name} an Admin?`}
                    {actionType === "revoke" && `Revoke admin access for ${selectedUser?.name}?`}
                    {actionType === "promote" && `Promote ${selectedUser?.name} to Level 2?`}
                    {actionType === "demote" && `Demote ${selectedUser?.name} to Level 1?`}
                </DialogTitle>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} color="secondary" size={"small"} variant="outlined">Cancel</Button>
                    <Button onClick={handleDialogConfirm} color="primary" size={"small"} variant="contained">Confirm</Button>
                </DialogActions>
            </Dialog>
        </Grid>
    );
};

export default AdminUsersManagement;
