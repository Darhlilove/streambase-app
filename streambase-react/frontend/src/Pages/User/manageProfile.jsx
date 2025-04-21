import React from 'react';
import UserForm from "../../Components/General/userForm";

const ManageProfile = () => {
    return (
        <div style={{ height: "100vh" }}>
            <UserForm isManageProfile={true}/>
        </div>
    );
};

export default ManageProfile;
