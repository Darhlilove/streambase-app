import React, {useState, useEffect} from 'react';
import {
    Box, Button, FormControl, ListItemText, Checkbox, InputLabel, MenuItem, Select, TextField, Typography,
    OutlinedInput, FormHelperText, CircularProgress, Avatar
} from "@mui/material";
import '../../Styles/SignIn&UpPage.css'
import {useNavigate} from "react-router-dom";
import {toast} from "react-toastify";
import {loadGenres, MOVIE_GENRES} from './genres';
import Theme from "../../Styles/Theme";
import DeleteAccountDialog from "./deleteAccountDialog";
import {
    registerUser,
    loginUser,
    loginAdmin,
    updateProfile,
    deleteProfile,
    updatePassword
} from "../../Functions/handeUserAccountRequests.jsx"
import {useLocalStorage} from "../../Functions/useLocalStorage.jsx";

function validatePassword(password) {
    const minLength = 8; // Minimum password length
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
        return "Password must be at least 8 characters long.";
    }
    if (!hasUpperCase) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!hasNumber) {
        return "Password must contain at least one number.";
    }
    if (!hasSpecialChar) {
        return "Password must contain at least one special character.";
    }

    return "Valid";
}

const UserForm = ({isManageProfile = false, isSignUp = false, isSignIn = false, isAdmin = false}) => {
    const defaultUser = {
        name: '',
        email: '',
        password: ''
    }

    const [user, setUser] = useState(null)

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [passwordUpdate, setPasswordUpdate] = useState({
        currentPassword: '',
        confirmPassword: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [moviePreferences, setMoviePreferences] = useState(isManageProfile ? user?.moviePreferences || [] : []);
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [signUp, setSignUp] = useState(isSignUp);
    const navigate = useNavigate();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [adminPin, setAdminPin] = useState('');
    const [imageUploaded, setImageUploaded] = useState(false);
    const [currentUser, setCurrentUser] = useLocalStorage( isAdmin? 'admin' : 'user');

    const [genres, setGenres] = useState([]);

    const fetchUser = async () => {
        // If user is not found in localStorage, throw an error
        if (!currentUser) {
            throw new Error('User not found in localStorage');
        }

        // Make the API call with proper error handling
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users?email=${currentUser.email}`);

        // If response is not OK, throw an error with a message
        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        // Parse the response JSON
        const data = await response.json();
        const user = data[0]

        // Check if the necessary fields exist in data
        if (!user || !user.name || !user.password || !user.email) {
            throw new Error('Incomplete user data received');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            moviePreferences: user.moviePreferences,
            image: user.image || '',
        };
    };

    // Fetch genres
    useEffect(() => {
        loadGenres().then(() => {
            const genres = [...new Set(MOVIE_GENRES.map(item => {
                return {id: item.id, name: item.name};
            }))];
            setGenres(genres);
        });
    })

    // Fetch user data
    useEffect(() => {
        const getUser = async () => {
            const data = await fetchUser();
            setUser(data);
        }

        if (isManageProfile) {
            getUser().then(() => {
            })
        }
    }, [isManageProfile]);

    // Update formData when user data is fetched
    useEffect(() => {
        if (user && isManageProfile) {
            setFormData({
                name: user.name,
                email: user.email,
                password: '',
            });
            setMoviePreferences(user.moviePreferences || []);
            setImage(user.image || null);
        }
    }, [user, isManageProfile]);

    const getSelectedGenreNames = () => {
        return genres
            .filter(genre => moviePreferences.includes(genre.id))
            .map(genre => genre.name);
    };

    // Check user's movie preferences in movie preferences in checkbox
    useEffect(() => {
        isManageProfile && getSelectedGenreNames();
    }, [isManageProfile, user]);

    const handleFormChange = (e) => {
        const {name, value} = e.target;

        const capitalizedValue = name === 'name' ?
            value.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
            : value;

        setFormData({...formData, [name]: capitalizedValue});
        setPasswordUpdate({...passwordUpdate, [name]: value});

        if (name === 'adminPin') {
            setAdminPin(value);
        }

        if (name === 'email' && value.includes('@') && value.includes('.') && value.length > 5 && errors.email) {
            setErrors((prevErrors) => {
                const {email, ...rest} = prevErrors;
                return rest;
            });
        }

        if (name === 'password' && value && passwordUpdate.confirmPassword === value && errors[name]) {
            setErrors((prevErrors) => {
                const {[name]: removedError, ...rest} = prevErrors;
                return rest;
            });
        }

        if (name !== 'email' && value && errors[name]) {
            setErrors((prevErrors) => {
                const {[name]: removedError, ...rest} = prevErrors;
                return rest;
            });
        }
    };

    const handleSelectChange = (event) => {
        const {
            target: {value},
        } = event;

        const newValues = typeof value === 'string' ? value.split(',') : value;
        setMoviePreferences(newValues);

        if (newValues.length > 0 && errors.moviePreferences) {
            setErrors((prevErrors) => {
                const {moviePreferences, ...rest} = prevErrors;
                return rest;
            });
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const adminData = await loginAdmin({email: formData.email, password: formData.password, pin: adminPin});
                setCurrentUser(adminData);
                toast.success("Admin sign-in successful!");
                setTimeout(() => navigate("/admin-dashboard"), 1000);
            } else {
                const userData = await loginUser({email: formData.email, password: formData.password});
                setCurrentUser(userData);
                toast.success("Sign-in successful!");
                setTimeout(() => navigate("/home"), 1000);
            }

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        try {
            const {confirmPassword, ...rest} = formData
            await registerUser({
                email: formData.email.toLowerCase(), ...rest, moviePreferences
            });
            toast.success("Sign-up successful!");
            setTimeout(() => {
                setFormData(defaultUser);
                setPasswordUpdate({confirmPassword: '', currentPassword: ''});
                setMoviePreferences([]);
                setSignUp(false);
                navigate("/signin");
            }, 2500);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setLoading(true);

        try {
            let updatedUser
            if (isAdmin) {
                updatedUser = await updateProfile(user.id, {
                    name: formData.name,
                    email: formData.email,
                    image
                }, "admin");
            } else {
                updatedUser = await updateProfile(user.id, {
                    name: formData.name,
                    email: formData.email,
                    moviePreferences,
                    image
                }, "users");
            }
            setCurrentUser(updatedUser);
            toast.success("Profile updated successfully!");
            setUser(updatedUser);
            setIsEditing(false);
            navigate(-1);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        // Check file size (Max 5MB)
        const maxSize = 0.5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            toast.error("Image size exceeds 500KB. Please choose a smaller file.");
            return;
        }

        // Convert image to Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setImage(reader.result); // Base64 string
            setImageUploaded(true)
        };
        reader.onerror = () => {
            toast.error("Failed to read file. Please try again.");
        };
    };

    const handleUpdatePassword = async () => {
        setLoading(true);
        try {
            if (passwordUpdate.currentPassword === formData.password) {
                toast.error("New password cannot be the same as the current password.");
                return;
            }

            if (isAdmin) {
                await updatePassword(user.id, formData.password, "admin");

                toast.success("Password updated successfully!");
                setChangePassword(false);
                navigate("/admin-dashboard");
            } else {
                await updatePassword(user.id, formData.password, "users");
                toast.success("Password updated successfully!");
                setChangePassword(false);
                navigate("/home");
            }

        } catch (error) {
            toast.error(error.message || "Password update failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Function to handle delete
    const handleDelete = async () => {
        setOpenDeleteDialog(true);
        try {

            if (isAdmin) {
                await deleteProfile(user.id, "admin");
            } else {
                await deleteProfile(user.id, "users");
            }
            localStorage.removeItem("user");
            toast.success("Account deleted successfully.");
            navigate("/");
        } catch (error) {
            toast.error("Failed to delete account. Try again.");
        }
    };

    // Function to handle closing the dialog
    const handleCloseDialog = () => {
        setOpenDeleteDialog(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(!isEditing);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
        });
        setMoviePreferences(user.moviePreferences || []);
        setImage(user.image || null);
        setImageUploaded(false)
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const passwordErrorMessage = validatePassword(formData.password)

        const newErrors = {};
        if (!formData.email || !formData.email.includes("@") || formData.email.length <= 5) newErrors.email = 'Please enter a valid email';
        if (signUp && (!formData.password || passwordErrorMessage !== "Valid")) newErrors.password = passwordErrorMessage;
        if (signUp && (formData.password !== passwordUpdate.confirmPassword)) newErrors.confirmPassword = "Different password entered. Please enter the same password";
        if (signUp && !formData.name) newErrors.name = 'Name is required';
        if (signUp && moviePreferences.length === 0) newErrors.moviePreferences = 'Please select movie preferences';

        if (Object.keys(newErrors).length === 0) {
            if (signUp) {
                await handleSignUp();
            } else if (isSignIn) {
                await handleSignIn();
            } else if (isManageProfile) {
                if (changePassword) {
                    await handleUpdatePassword()
                } else {
                    await handleUpdateProfile();
                }
            }
        } else {
            setErrors(newErrors);
        }
    };

    return (
        <Box
            className={isManageProfile ? null : "login-page-form"}
            sx={{
                display: "flex",
                alignItems: "center",
                width: isManageProfile ? "1200px" : "100%",
                padding: "20px",
                flexDirection: "column",
                marginX: "auto"
            }}
        >
            <Typography variant="h5" gutterBottom sx={{textAlign: "center", fontWeight: "bold", fontSize: 36}}>
                {signUp ? 'Sign Up' : isSignIn && 'Sign In'}
            </Typography>

            <Typography variant="h5" gutterBottom sx={{textAlign: "center", fontSize: 16}}>
                {signUp ? 'Welcome, please provide your details' : isSignIn && 'Welcome, please sign in to continue'}
            </Typography>

            <form onSubmit={handleSubmit} autoComplete="off" style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "30px"
            }}>
                {isManageProfile && (
                    <>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            width: '100%',
                            marginBottom: '40px'
                        }}>
                            <Typography variant="h4" gutterBottom style={{textAlign: 'left', fontWeight: 'bold'}}>
                                Manage Profile
                            </Typography>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: "flex-start",
                                gap: 2,
                                flexWrap: "wrap",
                            }}>
                                <Button
                                    onClick={handleCancelEdit}
                                    disabled={changePassword}
                                    sx={{
                                        backgroundColor: changePassword ? "#ccc" : Theme.palette.primary.main,
                                        color: changePassword ? "#fff" : Theme.palette.background.default,
                                        padding: "6px 16px",
                                        fontSize: 12,
                                        borderRadius: "20px",
                                        minWidth: "120px",
                                        "&:hover": {
                                            backgroundColor: Theme.palette.primary.dark,
                                        }
                                    }}
                                >
                                    {isEditing ? 'Cancel' : 'Edit'}
                                </Button>

                                <Button
                                    onClick={() => {
                                        setPasswordUpdate({
                                            currentPassword: '',
                                            confirmPassword: ''
                                        })
                                        setChangePassword(!changePassword)
                                    }}
                                    disabled={isEditing}
                                    sx={{
                                        backgroundColor: isEditing ? "#ccc" : Theme.palette.primary.main,
                                        color: isEditing ? "#fff" : Theme.palette.background.default,
                                        padding: "6px 16px",
                                        fontSize: 12,
                                        borderRadius: "20px",
                                        minWidth: "150px",
                                        "&:hover": {
                                            backgroundColor: Theme.palette.primary.dark,
                                        }
                                    }}
                                >
                                    {!changePassword ? 'Update Password' : "Cancel"}
                                </Button>

                                <Button
                                    onClick={() => setOpenDeleteDialog(true)}
                                    disabled={isEditing || changePassword}
                                    sx={{
                                        backgroundColor: isEditing || changePassword ? "#ccc" : "red",
                                        color: isEditing || changePassword ? "#fff" : Theme.palette.background.default,
                                        padding: "6px 16px",
                                        fontSize: 12,
                                        minWidth: "130px",
                                        borderRadius: "20px",
                                        "&:hover": {
                                            backgroundColor: isEditing ? "#ccc" : "#d30808",
                                        }
                                    }}
                                >
                                    Delete Account
                                </Button>
                            </Box>
                        </Box>
                        <Box sx={{display: 'flex', gap: "40px", width: '100%'}}>
                            <Box sx={{display: 'flex'}}>
                                <Avatar src={user?.image || null}
                                        style={{width: '100px', height: '100px', marginBottom: '20px'}}/>
                            </Box>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                flexDirection: 'column',
                                gap: 2,
                                width: '100%'
                            }}>
                                {
                                    !changePassword ? (
                                            <>
                                                <TextField
                                                    required
                                                    label="Name"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                    disabled={!isEditing}
                                                />
                                                <TextField
                                                    required
                                                    label="Email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleFormChange}
                                                    fullWidth
                                                    margin="normal"
                                                    disabled={!isEditing}
                                                />
                                                <FormControl fullWidth margin="normal" error={!!errors.moviePreferences}>
                                                    <InputLabel>Movie Preferences</InputLabel>
                                                    <Select
                                                        required
                                                        variant="outlined"
                                                        multiple
                                                        value={moviePreferences}
                                                        onChange={handleSelectChange}
                                                        disabled={!isEditing}
                                                        input={<OutlinedInput label="Movie Preferences"/>}
                                                        renderValue={() => getSelectedGenreNames().join(', ')}
                                                        MenuProps={{
                                                            PaperProps: {
                                                                style: {
                                                                    maxHeight: 220,
                                                                    overflowY: 'auto'
                                                                }
                                                            },
                                                            anchorOrigin: {
                                                                vertical: "bottom",
                                                                horizontal: "left"
                                                            },
                                                            transformOrigin: {
                                                                vertical: "top",
                                                                horizontal: "left"
                                                            }
                                                        }}
                                                        sx={{
                                                            '& .MuiInputBase-root:-webkit-autofill': {
                                                                backgroundColor: 'transparent !important',
                                                                color: 'inherit !important',
                                                                border: '1px solid #ccc',
                                                                boxShadow: 'none !important',
                                                            },
                                                            '& .MuiInputBase-root:-moz-placeholder': {
                                                                backgroundColor: 'transparent !important',
                                                                color: 'inherit !important',
                                                            },
                                                        }}
                                                    >
                                                        {genres.map((genre) => (
                                                            <MenuItem key={genre.id} value={genre.id}>
                                                                <Checkbox checked={moviePreferences.includes(genre.id)}/>
                                                                <ListItemText primary={genre.name}/>
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    {errors.moviePreferences &&
                                                        <FormHelperText>{errors.moviePreferences}</FormHelperText>}
                                                </FormControl>

                                                <Button
                                                    variant="outlined"
                                                    component="label"
                                                    fullWidth
                                                    disabled={!isEditing}
                                                    sx={{marginTop: 2, padding: '15px'}}
                                                >
                                                    {imageUploaded ? "Image uploaded" : "Upload Image"}
                                                    <input
                                                        type="file"
                                                        hidden
                                                        accept="image/*"
                                                        onChange={handleImageChange}
                                                    />
                                                </Button>
                                            </>
                                        )
                                        :
                                        <>
                                            <TextField
                                                required
                                                label="Current Password"
                                                name="currentPassword"
                                                type="password"
                                                value={passwordUpdate.currentPassword}
                                                onChange={handleFormChange}
                                                fullWidth
                                                margin="normal"
                                                error={!!errors.password}
                                                helperText={errors.password}
                                            />

                                            <TextField
                                                required
                                                label="New Password"
                                                name="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleFormChange}
                                                fullWidth
                                                margin="normal"
                                                error={!!errors.password}
                                                helperText={errors.password}
                                            />

                                            <TextField
                                                required
                                                label="Confirm Password"
                                                name="confirmPassword"
                                                type="password"
                                                value={passwordUpdate.confirmPassword}
                                                onChange={handleFormChange}
                                                fullWidth
                                                margin="normal"
                                                error={!!errors.confirmPassword}
                                                helperText={errors.confirmPassword}
                                            />
                                        </>
                                }


                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    disabled={loading || (!isEditing && !changePassword)}
                                    sx={{marginTop: 2.5, fontSize: "15px", padding: '20px', borderRadius: '48px'}}
                                >
                                    {loading ? <CircularProgress
                                        size={24}/> : changePassword ? "Save Password" : 'Save Profile'}
                                </Button>
                            </Box>

                            <DeleteAccountDialog open={openDeleteDialog} onClose={handleCloseDialog}
                                                 onDelete={handleDelete}/>
                        </Box>
                    </>
                )}

                {(signUp || isSignIn) && (
                    <>
                        {signUp && (
                            <TextField
                                required
                                label="Name"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                error={!!errors.name}
                                helperText={errors.name}
                            />
                        )}

                        <TextField
                            required
                            label="Email"
                            name="email"
                            value={formData.email}
                            onChange={handleFormChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.email}
                            helperText={errors.email}
                        />

                        <TextField
                            required
                            label="Password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleFormChange}
                            fullWidth
                            margin="normal"
                            error={!!errors.password}
                            helperText={errors.password}
                        />

                        {signUp && (
                            <TextField
                                required
                                label="Confirm Password"
                                name="confirmPassword"
                                type="password"
                                value={passwordUpdate.confirmPassword}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                                error={!!errors.confirmPassword}
                                helperText={errors.confirmPassword}
                            />
                        )}

                        {signUp && (
                            <FormControl fullWidth margin="normal" error={!!errors.moviePreferences}>
                                <InputLabel>Movie Preferences</InputLabel>
                                <Select
                                    required
                                    variant="outlined"
                                    multiple
                                    value={moviePreferences}
                                    onChange={handleSelectChange}
                                    input={<OutlinedInput label="Movie Preferences"/>}
                                    renderValue={() => getSelectedGenreNames().join(', ')}
                                    MenuProps={{
                                        PaperProps: {
                                            style: {
                                                maxHeight: 220,
                                                overflowY: 'auto'
                                            }
                                        },
                                        anchorOrigin: {
                                            vertical: "bottom",
                                            horizontal: "left"
                                        },
                                        transformOrigin: {
                                            vertical: "top",
                                            horizontal: "left"
                                        }
                                    }}
                                    sx={{
                                        '& .MuiInputBase-root:-webkit-autofill': {
                                            backgroundColor: 'transparent !important',
                                            color: 'inherit !important',
                                            border: '1px solid #ccc',
                                            boxShadow: 'none !important',
                                        },
                                        '& .MuiInputBase-root:-moz-placeholder': {
                                            backgroundColor: 'transparent !important',
                                            color: 'inherit !important',
                                        },
                                    }}
                                >
                                    {genres.map((genre) => (
                                        <MenuItem key={genre.name} value={genre.id}>
                                            <Checkbox checked={moviePreferences.includes(genre.id)}/>
                                            <ListItemText primary={genre.name}/>
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.moviePreferences && <FormHelperText>{errors.moviePreferences}</FormHelperText>}
                            </FormControl>
                        )}

                        {
                            isAdmin &&
                            <TextField
                                required
                                label="Pin"
                                name="adminPin"
                                type="password"
                                value={adminPin}
                                onChange={handleFormChange}
                                fullWidth
                                margin="normal"
                            />
                        }

                        <Button type="submit" variant="contained" color="primary" fullWidth
                                sx={{marginTop: 2, fontSize: "15px"}}>
                            {signUp ? (loading ? <CircularProgress/> : 'Sign Up') : (loading ?
                                <CircularProgress/> : 'Sign In')}
                        </Button>

                        {(signUp && errors.SignUpError) && <Typography> {errors.SignUpError}</Typography>}

                        <Typography
                            variant="caption"
                            sx={{marginTop: 2, display: 'block', width: '100%', textAlign: 'center'}}
                        >
                            {
                                signUp && !isAdmin ?
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <Typography variant="body2">
                                            Already have an account?
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            className="login-page-call-to-action"
                                            sx={{fontWeight: 'bold'}}
                                            onClick={() => {
                                                setErrors({})
                                                setSignUp(false);
                                                navigate("/signin")
                                            }}> Sign In </Typography>
                                    </div>

                                    : !signUp && !isAdmin &&
                                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <Typography variant="body2">
                                            Don't have an account?
                                        </Typography>
                                        <Typography
                                            variant="body1"
                                            className="login-page-call-to-action"
                                            sx={{fontWeight: 'bold'}}
                                            onClick={() => {
                                                setFormData(defaultUser);
                                                setPasswordUpdate({confirmPassword: '', currentPassword: ''})
                                                setMoviePreferences([]);
                                                setErrors({});
                                                setSignUp(true);
                                                navigate("/signup");
                                            }}> Sign Up </Typography>
                                    </div>
                            }
                        </Typography>
                    </>
                )}
            </form>
        </Box>
    );
};

export default UserForm;
