const API_URL = import.meta.env.VITE_API_URL

export function registerUser(userData) {
    return fetch(API_URL + "/users")
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch users! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(users => {
            // Check if an account with the email already exists
            const existingUser = users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error("An account with this email already exists.");
            }

            // Proceed with registration if email is unique
            return fetch(API_URL + "/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(userData),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Sign up failed! Please try again later.`);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error("Error registering user:", error);
            throw Error("Sign up failed! Please try again later.");
        });
}

export function loginUser({email, password}) {
    return fetch(API_URL + `/users?email=${email}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch users! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {

            if (!user || user.length === 0) {
                throw new Error("User not found!");
            }

            if (user.suspended) {
                throw new Error("Your account has been suspended!");
            }

            // Compare passwords
            if (user[0].password !== password) {
                throw new Error("Incorrect password!");
            }
            return (
                {
                    id: user[0].id,
                    name: user[0].name,
                    email: user[0].email,
                    image: user[0].image || null
                }
            );
        })
        .catch(() => {
            throw Error("Sign in failed! Please try again later.");
        });
}

export function loginAdmin({email, password, pin}) {
    return fetch(API_URL + `/admin?email=${email}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch users! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {

            if (!user || user.length === 0) {
                throw new Error("User not found!");
            }

            // Compare passwords
            if (user[0].password !== password) {
                throw new Error("Incorrect password!");
            }

            // Compare pin
            if (user[0].pin !== pin) {
                throw new Error("Incorrect pin!");
            }
            return (
                {
                    id: user[0].id,
                    name: user[0].name,
                    email: user[0].email,
                    image: user[0].image || null
                }
            );
        })
        .catch(error => {
            console.error("Error logging in user:", error);
            throw Error("Sign in failed! Please try again later.");
        });
}

export function updateProfile(id, formData, endpoint) {
    return fetch(API_URL + `/${endpoint}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Profile update failed! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(updatedUser => {
            return (
                {
                    id: updatedUser.id,
                    name: updatedUser.name,
                    email: updatedUser.email,
                    moviePreferences: updatedUser.moviePreferences,
                    image: updatedUser.image || null
                }
            );
        })
        .catch(() => {
            throw Error("User profile updated failed! Please try again later.");
        });
}

export function deleteProfile(id, endpoint) {
    let users = [];
    let archivedUsers = [];

    return Promise.all([
        fetch(`${API_URL}/${endpoint}`).then(res => res.json()),
        fetch(`${API_URL}/archived-${endpoint}`).then(res => res.json())
    ])
        .then(([usersData, archivedUsersData]) => {
            users = usersData || [];
            archivedUsers = archivedUsersData || [];

            const userIndex = users.findIndex(user => user.id === id);
            if (userIndex === -1) throw new Error("Account not found!");

            // Move user to archived-users
            const userToArchive = users[userIndex];
            archivedUsers.push(userToArchive);

            // Remove user from users list
            users.splice(userIndex, 1);

            // Save updated users and archived users in a single API call
            return Promise.all([
                fetch(`${API_URL}/${endpoint}/${id}`, {
                    method: "DELETE",
                }),
                fetch(`${API_URL}/archived-${endpoint}`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify(archivedUsers),
                })
            ]);
        })
        .then(([usersResponse, archivedUsersResponse]) => {
            if (!usersResponse.ok || !archivedUsersResponse.ok) {
                throw new Error("Failed to update users or archived-users!");
            }
        })
        .catch(() => {
            throw Error("Account deletion failed! Please try again later.");
        });
}

export function updatePassword(id, newPassword, endpoint) {
    return fetch(`${API_URL}/${endpoint}/${id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch users! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(user => {
            if (!user) {
                throw new Error("User not found!");
            }

            if (user.password === newPassword) {
                throw new Error("Please enter a new password!")
            }

            // Update the password (stored in plain text)
            user.password = newPassword;

            return fetch(`${API_URL}/users/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(user),
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Password update failed! Status: ${response.status}`);
            }
        })
        .catch(() => {
            throw Error("Failed to update password! Please try again.");
        });
}
