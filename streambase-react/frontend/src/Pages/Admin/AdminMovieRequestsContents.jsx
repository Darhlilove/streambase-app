import React, { useState, useEffect } from 'react';
import {
    Box, Button, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow,
    Tooltip, Typography
} from "@mui/material";
import { fetchMovieRequests, approveMovieRequest, declineMovieRequest } from "../../Redux/movieRequestsReducer.js";
import {useDispatch, useSelector} from "react-redux";
import {sendNotification} from "../../Redux/notificationsReducer.js";
import {ArrowDownward, ArrowUpward, CheckCircle, FiberManualRecord} from "@mui/icons-material";
import CancelIcon from "@mui/icons-material/Cancel";
import Stack from "@mui/material/Stack";

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    }) + `, ` + date.toLocaleTimeString("en-US", { hour12: false });
};

export const FilterButton = ({title, handleFilter, isActive}) => {
    return (
        <Button variant="contained"
                color="#fff"
                sx={{
                    border: "1px solid rgba(51, 51, 51, 0.5)",
                    borderRadius: "20px",
                    height: "30px",
                    fontSize: "10px",
                    backgroundColor: isActive ? "#FEB508" : "transparent",
                    color: isActive ? "#070501" : "#fff",
                    "&:hover": { color: "#fff", backgroundColor: "#252424"},
                }}
                onClick={handleFilter}
        >
            {title}
        </Button>
    )
}

const AdminMovieRequestsContents = () => {
    const dispatch = useDispatch();
    const {requests, status } = useSelector((state) => state.movieRequests);
    const [filteredRequests, setFilteredRequests] = useState([]);
    const [activeFilter, setActiveFilter] = useState("all");

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchMovieRequests());
        }
    }, [dispatch, status]);

    // Apply filtering when `requests` or `activeFilter` changes
    useEffect(() => {
        if (!requests || requests.length === 0) {
            setFilteredRequests([]); // Prevent issues with empty data
            return;
        }

        let updatedRequests = [...requests];

        if (activeFilter !== "all") {
            updatedRequests = updatedRequests.filter(request => request.status === activeFilter);
        }

        setFilteredRequests(updatedRequests);
    }, [requests, activeFilter]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const handleApprove = (request) => {
        dispatch(approveMovieRequest({requestId: request.id, title: request.movieTitle, mediaType: request.mediaType}));
        sendNotification({
            date: new Date().toISOString(),
            from: "Admin1",
            to: request.senderId,
            message: `Your request for ${request.movieTitle} was approved. You can now view it on Streambase.`,
            read: false,
        })
    };

    const handleDecline = (request) => {
        dispatch(declineMovieRequest(request.id));
        sendNotification({
            date: new Date().toISOString(),
            from: "Admin1",
            to: requestor.senderId,
            message: `Sorry! Your request for ${request.movieTitle} was declined.`,
            read: false,
        })
    };

    const handleFilter  = (filter) => {
        setActiveFilter(filter);
    }

    const handleSortByRequestDate = (dir) => {
        const sortedRequests = [...filteredRequests].sort((a, b) =>
            dir === "desc" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt)
        );
        setFilteredRequests(sortedRequests);
    };

    return (
        <Grid item xs={12} sm={12} md={6} sx={{ marginTop: "20px", marginBottom: "20px", height: "100%", width: "100%",
            paddingY: "20px", paddingX: "40px" }}
        >
            <Box sx={{ display: 'flex', position: "sticky", top: 0, zIndex: 1000, justifyContent: 'space-between',
                alignItems: 'flex-end', mb: "20px", backgroundColor: "#070501", paddingBottom: "30px"}}>
                <Typography variant="h4" fontWeight={"bold"} component="div">
                    Movie Requests
                </Typography>
                <Stack direction="row" spacing={2}>
                    <FilterButton title={"Pending"} handleFilter={() => handleFilter("pending")}
                                  isActive={activeFilter === "pending"}
                    />
                    <FilterButton title={"Approved"} handleFilter={() => handleFilter("approved")}
                                  isActive={activeFilter === "approved"}
                    />
                    <FilterButton title={"Declined"} handleFilter={() => handleFilter("declined")}
                                  isActive={activeFilter === "declined"}
                    />
                    <FilterButton title={"All"} handleFilter={() => handleFilter("all")}
                                  isActive={activeFilter === "all"}
                    />
                </Stack>
            </Box>

            <TableContainer sx={{ maxHeight: "700px", overflowY: "auto" }}>
                <Table aria-label="simple table" stickyHeader sx={{ width: '100%', height: "100%", alignItems: 'center',
                    justifyContent: 'space-between', zIndex: 100 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: "bold", fontSize: "18px"}}>Movie Title</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "18px"}}>Media Type</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "18px"}}>Year of Release</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "18px", alignItems: "center"}}>
                                <>
                                    Request Date
                                    <IconButton onClick={() => handleSortByRequestDate("desc")}>
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

                                    <IconButton onClick={() => handleSortByRequestDate("asc")}>
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
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "18px"}}>Status</TableCell>
                            <TableCell align="center" sx={{ fontWeight: "bold", fontSize: "18px"}}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRequests?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((request, index) => (
                            <TableRow key={index}>
                                <TableCell component="th" scope="row" sx={{ fontSize: "16px"}}>
                                    {request.movieTitle}
                                </TableCell>
                                <TableCell align="center" sx={{ fontSize: "16px"}}>{request.mediaType === "tv" ? "TV" : "Movie"}</TableCell>
                                <TableCell align="center" sx={{ fontSize: "16px"}}>{request.year}</TableCell>
                                <TableCell align="center" sx={{ fontSize: "16px"}}>{formatDate(request.createdAt)}</TableCell>
                                <TableCell align="center" sx={{ fontSize: "16px"}}>{
                                    <Tooltip title={request.status === 'pending' ? "Pending Approval"
                                        : request.status === 'approved' ? "Approved" : "Declined"}
                                    >
                                        <FiberManualRecord
                                            sx={{
                                                color: request.status === 'pending' ? "#9e9d9d"
                                                    : request.status === 'approved' ? "#4fb106" : "#d30808",
                                                cursor: "pointer"
                                            }}
                                        />
                                    </Tooltip>
                                }
                                </TableCell>
                                <TableCell align="center" sx={{ textAlign: "center" }}>
                                    <Tooltip title="Approve" placement="top">
                                        <IconButton
                                            disabled={request.status === 'approved' || request.status === 'declined'}
                                            sx={{ color: "#4fb106", cursor: "pointer", margin: "2px",
                                                transition: {transform: "scale(0.9)"} }}
                                            onClick={() => handleApprove(request)}
                                        >
                                            <CheckCircle>
                                                Approve
                                            </CheckCircle>
                                        </IconButton>
                                    </Tooltip>

                                    <Tooltip title={"Decline"} placement={"top"}>
                                        <IconButton
                                            disabled={request.status === 'approved' || request.status === 'declined'}
                                            sx={{ color: "red", cursor: "pointer", margin: "2px",
                                                transition: {transform: "scale(0.9)"} }}
                                            onClick={() => handleDecline(request)}
                                        >
                                            <CancelIcon>
                                                Disapprove
                                            </CancelIcon>
                                        </IconButton>

                                    </Tooltip>
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
                count={filteredRequests.length}
                rowsPerPage={Math.min(rowsPerPage || filteredRequests.length)}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Grid>
    );
};

export default AdminMovieRequestsContents;