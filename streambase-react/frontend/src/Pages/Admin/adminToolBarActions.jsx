import Stack from "@mui/material/Stack";
import AdminAccountMenu from "./adminAccountMenu.jsx";
import MovieSearchBar from "../../Components/General/movieSearchBar.jsx";
import AdminNotificationMenu from "./adminNotifications.jsx";

function AdminToolBarActions () {
    return (
        <Stack display={"flex"} flexDirection="row" gap={"10px"} paddingRight={"40px"}
               alignItems={"center"} justifyContent={"center"}
        >
            <MovieSearchBar width={"400px"}/>
            <AdminNotificationMenu />
            <AdminAccountMenu />
        </Stack>
    )
}

export default AdminToolBarActions;
