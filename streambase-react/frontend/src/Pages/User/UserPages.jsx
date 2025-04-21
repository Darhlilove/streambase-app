import React from 'react';
import Dashboard from "../Dashboard/Dashboard.jsx";
import {USER_NAVIGATION} from "../Dashboard/userNavigations.jsx";
import UserToolBarActions from "./userToolBarActions.jsx";
import {useLocalStorage} from "../../Functions/useLocalStorage.jsx";
import useCheckBanStatus from "../../Functions/checkUserBanStatus.jsx";

const UserPages = () => {
    const [user, setUser] = useLocalStorage("user")
    useCheckBanStatus(user)

    return (
        <div>
            <Dashboard toolbarActions={UserToolBarActions} hideNavigation={false} navigation={USER_NAVIGATION} />
        </div>
    );
};

export default UserPages;