import React from 'react';
import Dashboard from "../Dashboard/Dashboard.jsx";
import {ADMIN_NAVIGATION} from "../Dashboard/adminNavigations.jsx";
import AdminToolBarActions from "./adminToolBarActions.jsx";

const AdminPages = () => {
    return (
        <div>
            <Dashboard toolbarActions={AdminToolBarActions} hideNavigation={false} navigation={ADMIN_NAVIGATION} />
        </div>
    );
};

export default AdminPages;