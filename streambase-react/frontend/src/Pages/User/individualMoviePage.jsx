import React, { useState, useEffect, useMemo } from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    TextField,
    List,
    ListItem,
    Avatar,
    CircularProgress,
    Rating, Tooltip, Divider, Skeleton,
} from '@mui/material';
import {fetchReviews, postOrUpdateReply, postOrUpdateReview} from '../../Redux/reviewsReducer';
import { useDispatch, useSelector } from "react-redux";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import { fetchVideo } from "../../Redux/moviesReducer.js";
import { formatDistanceToNow } from 'date-fns'; // To format the relative time
import { useLocation } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {options} from "../../tmdbKey.jsx";
import CardIcons from "../../Components/MovieCards&Slider/cardIcons.jsx";

const parseDate = (dateString) => {
    const date = new Date(dateString);

    // Check if the input is a valid date
    if (isNaN(date)) {
        return '';
    }

    // Format the date to a readable string (e.g., "December 1, 2021")
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options); // Example: "December 1, 2021"
};


// Function to get the video trailer
const getTrailer = async (movieId, mediaType) => {
    try {
        if (!movieId || !mediaType) return

        const videos = await fetchVideo({movieId, mediaType});
        let videoUrl = '';

        if (videos.length > 0) {
            const video = videos[0];

            if (video.site === 'YouTube') {
                videoUrl = `https://www.youtube.com/embed/${video.key}?autoplay=1`;
            } else if (video.site === 'Vimeo') {
                videoUrl = `https://player.vimeo.com/video/${video.key}?autoplay=1`;
            } else if (video.site === 'Dailymotion') {
                videoUrl = `https://www.dailymotion.com/embed/video/${video.key}?autoplay=1`;
            }
        }

        return videoUrl;
    } catch (error) {
        console.error("Error fetching video trailer:", error);
        return ''; // Fallback URL
    }
};

const MoviePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentUser = JSON.parse(localStorage.getItem("user"));
    const dispatch = useDispatch();
    const { movieId } = useParams();
    const [movieMediaType, setMovieMediaType] = useState(localStorage.getItem('movieMediaType'));
    const [movieUrl, setMovieUrl] = useState(null);
    const { reviews } = useSelector(state => state.reviews);
    const [movie, setMovie] = useState(null);

    const [newComment, setNewComment] = useState('');
    const [newRating, setNewRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [editingReview, setEditingReview] = useState(false);

    const [reply, setReply] = useState('');
    const [viewReplies, setViewReplies] = useState(null);
    const [commentingOn, setCommentingOn] = useState(null); // Track comment the user is replying to

    useEffect(()=> {
        const movieMediaType = location.state?.media_type

        if (movieMediaType) {
            setMovieMediaType(movieMediaType);
        }

    }, [location.state]);

    //Fetch movie trailer on mount
    useEffect(() => {
        const fetchMovieVideo = async (id, mediaType) => {
            const url = await getTrailer(id, mediaType);
            setMovieUrl(url);
        };

        fetchMovieVideo(movieId, movieMediaType);
    }, [movieId, movieMediaType]);

    const fetchMovieData = async () => {
        try {
            if (!movieId || !movieMediaType) return;

            const response = movieMediaType === "movie"
                ? await fetch(`https://api.themoviedb.org/3/movie/${movieId}?language=en-US`, options)
                : await fetch(`https://api.themoviedb.org/3/tv/${movieId}?language=en-US`, options);

            if (!response.ok) {
                throw new Error('Failed to fetch movie data');
            }

            const movieData = await response.json();

            // Set the movie state with either 'results' or the entire data (in case of single item)
                setMovie(movieData || []);

            // Fetch reviews for the movie using Redux
            await dispatch(fetchReviews());

            setLoading(false);
        } catch (error) {
            console.error('Error fetching movie data', error);
            setLoading(false);
        }
    };

    // Fetch movie data and reviews on mount
    useEffect(() => {
        fetchMovieData();
    }, [movieId, movieMediaType]);

    const handleReviewChange = (event) => {
        setNewComment(event.target.value);
    };

    const handleReview = async () => {
        // If there's no comment and no rating, exit
        if (!newComment.trim() && newRating === 0) {
            return;
        }

        const reviewData = {
            movieId: movieId,
            movieMediaType: movieMediaType,
            text: newComment.trim() || '',  // Allow empty text if no comment is provided
            user: { ...currentUser, image: currentUser.image },
            rating: newRating,
            replies: [],  // Array to hold replies to this review
        };

        try {
            // Dispatch action to post the review or update an existing one
            if (editingReview) {
                await dispatch(postOrUpdateReview({ reviewData, reviewId: editingReview }));
                setEditingReview(null);
            } else {
                await dispatch(postOrUpdateReview({ reviewData, reviewId: null }));
            }

            await dispatch(fetchReviews());
            // Reset the comment after successful submission
            setNewComment('');
        } catch (error) {
            console.error('Error adding comment or rating', error);
        }
    };

    const handleReplyReview = async () => {
        // Reply structure (can be added when a user replies to a review)
        const replyData = {
            replyText: newReply.trim(), // The reply text
            replyUser: {...currentUser, "image": currentUser.image}, // User replying
            replyDate: new Date().toLocaleString(), // Date of reply
        };

        try {
            // Dispatch the action to post the reply or update an existing one
            await dispatch(postOrUpdateReply({ reviewId: commentingOn, replyData }));
            await dispatch(fetchReviews());

            setCommentingOn(null); // Reset comment reply state
        } catch (error) {
            console.error('Error adding comment', error);
        }
    }

    const handleReplyChange = (event) => {
        setReply(event.target.value);
    }

    // Sort reviews by createdAt in descending order
    const sortedReviews = useMemo(() => {
        return [...reviews]
            .filter((review) => String(review.movieId) === String(movieId) && review.movieMediaType === movieMediaType)
            .sort((a, b) => {
                // If 'a' is from the current user and 'b' is not, 'a' comes first
                if (a?.user?.email === currentUser?.email && b?.user?.email !== currentUser?.email) return -1;
                if (a?.user?.email !== currentUser?.email && b?.user?.email === currentUser?.email) return 1;

                // If both 'a' and 'b' are from the current user, or neither are, fall back to updatedAt
                return new Date(b.updatedAt) - new Date(a.updatedAt);
            });
    }, [reviews, currentUser, movieId, movieMediaType]);  // Include all dependencies

    const sortedReviewsReplies = useMemo(() => {
        return sortedReviews.map((review) => {
            // Extract the id and replies from each review
            const { id, replies } = review;

            // Ensure replies is an array, even if it's undefined or null
            const repliesArray = Array.isArray(replies) ? replies : [];

            // Sort the replies for the current review
            const sortedReplies = [...repliesArray].sort((a, b) => {
                // Prioritize replies from the current user
                if (a?.replyUser === currentUser?.name && b?.replyUser !== currentUser?.name) return -1;
                if (a?.replyUser !== currentUser?.name && b?.replyUser === currentUser?.name) return 1;

                // Sort by replyDate (descending)
                return new Date(b.replyDate) - new Date(a.replyDate);
            });

            // Return the review with the id and the sorted replies
            return { id, replies: sortedReplies };
        });
    }, [sortedReviews, currentUser]);

    // Format time for displaying as "x days ago", "x months ago", etc.
    const formatTime = (date) => formatDistanceToNow(new Date(date), { addSuffix: true });

    const userReviewIsAvailable = !!reviews.find((r) => (String(r.movieId) === String(movieId) && String(r.user.email === currentUser?.email)))

    return (
        <>
        {
            loading ?
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minWidth: "900px", width: '100%', height: "90%"}}>
                    <CircularProgress size={200}/>
                </Box>
                :
            <Box sx={{
                width: "80%",
                minWidth: "900px",
                padding: "40px",
                margin: '0 auto',
                display: "flex",
                flexDirection: "column",
                }}
            >
                <Box sx={{ display: "flex", position: "relative", justifyContent: "space-between", alignItems: "flex-start", flexDirection: "column" }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon/>}
                        onClick={() => {
                            navigate(-2)
                            localStorage.removeItem("movieMediaType");
                        }}
                        sx={{marginBottom: '20px', minWidth: "100px", width: "10%"}}
                    >
                        Back
                    </Button>

                    <Typography variant="h4" gutterBottom>
                        {movie?.title || movie?.name}
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{paddingBottom: '10px'}}>
                        {
                            movieMediaType === "movie" ? `Released: ${parseDate(movie?.release_date)}`
                                : `First air date: ${parseDate(movie?.first_air_date)}`
                        }
                    </Typography>
                    <CardIcons movie={movie} isVisible={true} isColumn={false} iconSize={"35px"} placement={"top"} />
                </Box>

                <Box sx={{display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px'}}>
                    {
                        movieUrl ?
                        <iframe
                            width="100%"
                            height="500"
                            src={movieUrl}
                            title="Movie Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                        :
                            <Skeleton
                                variant="rectangular"
                                width="100%"
                                height={500}
                                sx={{ display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "1.5rem", textAlign: "center", fontWeight: "bold" }}
                            >
                                Movie video not found
                            </Skeleton>
                    }
                </Box>
                <Typography variant="h6" color={"primary"} sx={{marginBottom: '10px', fontWeight: 'bold'}}>
                    { movie.tagline }
                </Typography>


            <Box sx={{marginTop: '10px'}}>
                <Box sx={{marginTop: '20px'}}>
                    <TextField
                        label="Add a Review"
                        variant="outlined"
                        fullWidth
                        multiline
                        rows={2}
                        value={userReviewIsAvailable ? "" : newComment}
                        onChange={handleReviewChange}
                        sx={{marginTop: '10px'}}
                        disabled={userReviewIsAvailable}
                    />

                    <Box sx={{marginTop: '20px', display: 'flex', justifyContent: 'space-between'}}>
                        <Box sx={{display: 'flex', justifyContent: "flex-end"}}>
                            <Rating
                                name="half-rating"
                                value={userReviewIsAvailable ? 0 : newRating}
                                precision={0.5}
                                onChange={(event, newValue) => {
                                    setNewRating(newValue);
                                }}
                                readOnly={userReviewIsAvailable}
                            />
                        </Box>

                        <Button
                            variant="contained"
                            color="primary"
                            sx={{marginTop: '10px'}}
                            onClick={handleReview}
                            disabled={userReviewIsAvailable}
                        >
                            <SendIcon/>
                        </Button>
                    </Box>
                </Box>

                {sortedReviews.length > 0 && (
                    <>
                        <Typography variant="h5" gutterBottom sx={{fontWeight: 'bold', mt: 2}}>
                            Reviews
                        </Typography>
                        <List sx={{width: '100%', paddingBottom: '20px'}}>
                            {sortedReviews.map((review, index) => (
                                <ListItem key={review.id}
                                          sx={{display: "flex", flexDirection: "column", width: "100%"}}>
                                    <Box sx={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                                        {
                                            editingReview && editingReview === review.id
                                                ?
                                                <Box onSubmit={handleReview} sx={{
                                                    display: "flex",
                                                    alignContent: "flex-start",
                                                    justifyContent: "flex-start",
                                                    width: "100%",
                                                    gap: "10px",
                                                    flexDirection: "column",
                                                }}>
                                                    <Rating
                                                        name="half-rating"
                                                        value={newRating}
                                                        onChange={(event, newValue) => {
                                                            setNewRating(newValue);
                                                        }}
                                                        precision={0.1}
                                                        size="small"
                                                    />
                                                    <TextField variant="standard" onChange={handleReviewChange}
                                                               sx={{
                                                                   minWidth: "300px",
                                                                   width: "100%",
                                                                   marginBottom: "10px"
                                                               }}/>
                                                    <Box>
                                                        <Button sx={{fontSize: "13px"}}
                                                                onClick={() => setEditingReview(null)}> Cancel </Button>
                                                        <Button disabled={newComment === ""} type={"submit"}
                                                                sx={{fontSize: "13px"}}> Update </Button>
                                                    </Box>
                                                </Box>
                                                :
                                                <>
                                                    <Avatar sx={{marginRight: 2}} src={review.user.image} />
                                                    <Box sx={{
                                                        display: 'flex',
                                                        gap: 2,
                                                        width: '100%',
                                                        justifyContent: 'space-between'
                                                    }}>
                                                        <Box sx={{alignItems: 'center'}} key={`box - ${review.id}`}>
                                                            <Box sx={{
                                                                display: "flex",
                                                                alignItems: 'center',
                                                                gap: "20px"
                                                            }}>
                                                                <Typography variant="body1" fontWeight="bold">
                                                                    {"@" + review.user.name}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary"
                                                                            sx={{
                                                                                backgroundColor: "rgba(97,96,96,0.2)",
                                                                                paddingX: "10px",
                                                                                paddingY: "1px",
                                                                                borderRadius: "5px",
                                                                            }}
                                                                >
                                                                    {formatTime(review.createdAt)} {/* Display time relative to now */}
                                                                </Typography>
                                                            </Box>
                                                            <Typography variant="body1"
                                                                        sx={{mt: "10px"}}>{review.text}</Typography>
                                                            <Box sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '10px',
                                                                mt: "2px"
                                                            }}>
                                                                <Rating
                                                                    name="half-rating"
                                                                    value={review.rating || 0}
                                                                    precision={0.1}
                                                                    size="small"
                                                                    readOnly
                                                                />
                                                                {
                                                                    !commentingOn && review.user.email !== currentUser.email && commentingOn !== review.id &&
                                                                    <Button
                                                                        onClick={() => {
                                                                            setCommentingOn(review.id)
                                                                        }}
                                                                        sx={{
                                                                            width: "10px",
                                                                            padding: '0.5px',
                                                                            fontSize: '13px',
                                                                            textTransform: 'none',
                                                                            borderRadius: '20px'
                                                                        }}
                                                                    >
                                                                        Reply
                                                                    </Button>
                                                                }
                                                            </Box>
                                                            <Tooltip title={"Replies"} placement="right-end">
                                                                {
                                                                    review.id !== viewReplies && review.replies.length > 0 ?
                                                                        <KeyboardArrowDownIcon
                                                                            onClick={() => {
                                                                                setViewReplies(review.id)
                                                                            }}
                                                                            sx={{
                                                                                fontSize: '30px',
                                                                                color: "secondary",
                                                                                borderRadius: '50%',
                                                                                cursor: 'pointer',
                                                                                "&:hover": {backgroundColor: "rgba(76,74,74,0.2)"}
                                                                            }}
                                                                        />
                                                                        : review.id === viewReplies && review.replies.length > 0 &&
                                                                        <KeyboardArrowUpIcon
                                                                            onClick={() => {
                                                                                setViewReplies(null)
                                                                            }}
                                                                            sx={{
                                                                                fontSize: '40px',
                                                                                color: "secondary",
                                                                                borderRadius: '50%',
                                                                                cursor: 'pointer',
                                                                                padding: 1,
                                                                                "&:hover": {backgroundColor: "rgba(76,74,74,0.2)"}
                                                                            }}
                                                                        />
                                                                }
                                                            </Tooltip>
                                                            {
                                                                viewReplies &&
                                                                sortedReviewsReplies
                                                                    .filter((rev) =>( rev.id === review.id))
                                                                    .map((rev) => (
                                                                        <>
                                                                            {
                                                                                rev.replies.length > 0 &&
                                                                                <>
                                                                                    {
                                                                                        rev.replies.map((reply, index) => {
                                                                                            return (
                                                                                            <ListItem key={index} sx={{
                                                                                                display: "flex",
                                                                                                flexDirection: "column",
                                                                                                marginRight: "80px",
                                                                                                width: "80%"
                                                                                            }}>
                                                                                                <Box sx={{
                                                                                                    width: '100%',
                                                                                                    display: 'flex',
                                                                                                    justifyContent: 'space-between'
                                                                                                }}>
                                                                                                    <>
                                                                                                        <Avatar
                                                                                                            sx={{marginRight: 2}}
                                                                                                            src={reply.replyUser.image}/>
                                                                                                        <Box sx={{
                                                                                                            display: 'flex',
                                                                                                            gap: 2,
                                                                                                            width: '100%',
                                                                                                            justifyContent: 'space-between'
                                                                                                        }}>
                                                                                                            <Box
                                                                                                                sx={{alignItems: 'center'}}>
                                                                                                                <Box
                                                                                                                    sx={{
                                                                                                                        display: "flex",
                                                                                                                        alignItems: 'center',
                                                                                                                        gap: "20px"
                                                                                                                    }}>
                                                                                                                    <Typography
                                                                                                                        variant="body1"
                                                                                                                        fontWeight="bold">
                                                                                                                        {"@" + reply.replyUser.name}
                                                                                                                    </Typography>
                                                                                                                    <Typography
                                                                                                                        variant="caption"
                                                                                                                        color="textSecondary"
                                                                                                                        sx={{
                                                                                                                            backgroundColor: "rgba(97,96,96,0.2)",
                                                                                                                            paddingX: "10px",
                                                                                                                            paddingY: "1px",
                                                                                                                            borderRadius: "5px",
                                                                                                                        }}
                                                                                                                    >
                                                                                                                        {formatTime(reply.replyDate)} {/* Display time relative to now */}
                                                                                                                    </Typography>
                                                                                                                </Box>
                                                                                                                <Typography
                                                                                                                    variant="body1"
                                                                                                                    sx={{mt: "10px"}}
                                                                                                                >
                                                                                                                    {reply.replyText}
                                                                                                                </Typography>
                                                                                                            </Box>
                                                                                                        </Box>
                                                                                                    </>
                                                                                                </Box>
                                                                                            </ListItem>
                                                                                            )
                                                                                        })
                                                                                    }
                                                                                </>
                                                                            }
                                                                        </>
                                                                ))
                                                            }
                                                        </Box>
                                                    </Box>
                                                    {
                                                        review.user.email === currentUser.email &&
                                                        <Tooltip title={"Edit"} placement={"right-end"}>
                                                            <EditIcon onClick={() => {
                                                                setEditingReview(review.id)
                                                                setNewRating(review.rating)
                                                            }}
                                                                      sx={{
                                                                          cursor: 'pointer',
                                                                          fontSize: '40px',
                                                                          color: "secondary",
                                                                          borderRadius: '50%',
                                                                          padding: 1,
                                                                          "&:hover": {backgroundColor: "rgba(76,74,74,0.2)"}
                                                                      }}
                                                            />
                                                        </Tooltip>
                                                    }
                                                </>
                                        }

                                    </Box>
                                    {
                                        commentingOn === review.id &&
                                        <Box onSubmit={handleReplyReview} sx={{
                                            display: "flex", alignContent: "flex-start",
                                            justifyContent: "flex-start", width: "100%", gap: "10px",
                                        }}>
                                            <TextField variant="standard" onChange={handleReplyChange}
                                                       sx={{
                                                           minWidth: "300px",
                                                           marginLeft: "60px",
                                                           marginBottom: "10px"
                                                       }}/>
                                            <Box>
                                                <Button sx={{fontSize: "13px"}}
                                                        onClick={() => setCommentingOn(null)}> Cancel </Button>
                                                <Button disabled={reply === ""} type={"submit"}
                                                        sx={{fontSize: "13px"}}> Reply </Button>
                                            </Box>
                                        </Box>
                                    }
                                    {
                                        index < sortedReviews.length - 1 &&
                                        <Divider sx={{ width: '100%', paddingTop: "10px"}}/>
                                    }
                                </ListItem>
                            ))}
                        </List>
                    </>
                )}
            </Box>
        </Box>
        }
        </>
    );
};

export default MoviePage;
