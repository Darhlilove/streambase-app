import Stack from "@mui/material/Stack";
import NotificationMenu from "./notifications.jsx";
import AccountMenu from "./accountMenu.jsx";
import MovieSearchBar from "../../Components/General/movieSearchBar.jsx";

function UserToolBarActions () {
    return (
        <Stack display={"flex"} flexDirection="row" gap={"10px"} paddingRight={"40px"}
               alignItems={"center"} justifyContent={"center"}
        >
            <MovieSearchBar width={"400px"}/>
            <NotificationMenu />
            <AccountMenu />
        </Stack>
    )
}

export default UserToolBarActions;
