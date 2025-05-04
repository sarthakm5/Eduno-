import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaComment, FaShare, FaEllipsisH, FaTrash, FaImage, FaDownload, FaEye } from 'react-icons/fa';
import { MdPictureAsPdf, MdInsertDriveFile } from 'react-icons/md';
import { Toaster, toast } from 'react-hot-toast';

const Post = () => {
  const { postid } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [token] = useState(localStorage.getItem('edunotoken'));
  const [userData, setUserData] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState(null);

  const getFileType = (url) => {
    if (!url) return null;
    const ext = url.split('.').pop().split('?')[0].toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'image': return <FaImage className="text-blue-600 text-2xl" />;
      case 'pdf': return <MdPictureAsPdf className="text-red-600 text-2xl" />;
      default: return <MdInsertDriveFile className="text-gray-600 text-2xl" />;
    }
  };

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API}/api/get/comments`, {
        params: { postid },
      });
      if (response.data.success) {
        setComments(response.data.comments);
      }
    } catch (err) {
      setCommentsError(err.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchPostAndUserData = async () => {
    try {
      setLoading(true);
      const postResponse = await axios.post(`${import.meta.env.VITE_API}/api/post`, { postid });
      if (!postResponse.data?.success || !postResponse.data.posts) {
        throw new Error(postResponse.data?.message || 'Failed to fetch post');
      }

      const postData = postResponse.data.posts;
      setPost(postData);
      setLikeCount(postData.likes?.length || 0);

      if (postData.fileUrl) {
        setFileUrl(postData.fileUrl);
        setFileType(getFileType(postData.fileUrl));
      }

      if (postData.fileUrl && postData.thumbnail) {
        setThumbnailUrl(postData.thumbnail);
      }

      if (token) {
        const userResponse = await axios.post(`${import.meta.env.VITE_API}/api/user`, { token });
        if (userResponse.data) {
          setUserData(userResponse.data);
          setLiked(userResponse.data.likedpost?.includes(postData._id) || false);
        }
      }

      await fetchComments();
    } catch (err) {
      setError(err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndUserData();
  }, [postid, token]);

  const handleLike = async () => {
    if (!token) {
      toast.error('Please login to like posts');
      return;
    }

    const originalLiked = liked;
    const originalLikeCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await axios.post(`${import.meta.env.VITE_API}/api/userlike`, {
        token,
        postid,
      });

      if (!response.data.post) {
        throw new Error(response.data.message || 'Invalid response from server');
      }

      setLikeCount(response.data.post.likes.length);
      setLiked(response.data.post.likes.some((like) => like._id === userData.userid));
    } catch (err) {
      console.error('Like error:', err);
      setLiked(originalLiked);
      setLikeCount(originalLikeCount);
      toast.error(err.message || 'Error updating like');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }
    if (!token) {
      toast.error('Please login to comment');
      return;
    }

    try {
      setCommentsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API}/api/posts/comments`, {
        token,
        commenttext: newComment,
        postid,
      });

      if (response.data.success) {
        setNewComment('');
        await fetchComments();
        toast.success('Comment added');
      } else {
        toast.error('Failed to add comment');
      }
    } catch (err) {
      setCommentsError(err.message);
      toast.error('Error adding comment');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) {
      toast.error('Please login to delete comments');
      return;
    }

    try {
      setCommentsLoading(true);
      const response = await axios.delete(
        `${import.meta.env.VITE_API}/api/posts/commentsdelete/${postid}/${commentId}`,
        { data: { token } }
      );

      if (response.data.success) {
        await fetchComments();
        toast.success('Comment deleted');
      } else {
        toast.error('Failed to delete comment');
      }
    } catch (err) {
      setCommentsError(err.message);
      toast.error('Error deleting comment');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/show-post/${postid}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      toast.success('Link copied to clipboard!', {
        style: {
          background: '#22c55e',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    }).catch(() => {
      toast.error('Failed to copy link', {
        style: {
          background: '#ef4444',
          color: '#fff',
          borderRadius: '8px',
        },
      });
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm max-w-md text-center">
          <strong className="font-semibold">Error: </strong>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm max-w-md text-center">
          <strong className="font-semibold">Error: </strong>
          <span>Post not found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Post header */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 hover:shadow-lg transition-shadow duration-300">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center space-x-3 cursor-pointer"
              onClick={() => navigate(`/profile/${post.user._id}`, { state: { fromPost: true } })}
            >
              <img
                src={post.user.profilepic || '/default-profile.png'}
                alt={post.user.username}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-white shadow-sm"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-profile.png';
                }}
              />
              <div>
                <h3 className="font-semibold text-gray-900 text-base sm:text-lg hover:underline">
                  {post.user.fullname || post.user.username}
                </h3>
                <p className="text-gray-500 text-sm">@{post.user.username}</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-900 p-2 rounded-full hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105">
              <FaEllipsisH size={18} />
            </button>
          </div>
        </div>

        {/* Post content */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6 hover:shadow-lg transition-shadow duration-300">
          {post.heading && (
            <div className="p-4 sm:p-6 pb-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{post.heading}</h2>
            </div>
          )}
          <div className="p-4 sm:p-6">
            {fileUrl ? (
              <div className="mb-6">
                {thumbnailUrl && fileType !== 'pdf' ? (
                  <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={thumbnailUrl}
                      alt="Post thumbnail"
                      className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-image.png';
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 flex justify-between items-center">
                      <div className="flex items-center text-white">
                        {getFileIcon(fileType)}
                        <span className="ml-2 text-sm font-medium capitalize">{fileType || 'file'}</span>
                      </div>
                      <a
                        href={fileUrl}
                        download
                        className="flex items-center px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105"
                      >
                        <FaDownload className="mr-2 sm:mr-2" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                    </div>
                  </div>
                ) : fileType === 'pdf' ? (
                  <div className="border border-gray-200 rounded-lg p-4 sm:p-5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center">
                      {getFileIcon(fileType)}
                      <span className="ml-3 text-gray-700 font-medium text-sm sm:text-base">PDF Attachment</span>
                    </div>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-transform duration-200 transform hover:scale-105"
                    >
                      <FaEye className="mr-2 sm:mr-2" />
                      <span className="hidden sm:inline">Preview</span>
                    </a>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4 sm:p-5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    <div className="flex items-center">
                      {getFileIcon(fileType)}
                      <span className="ml-3 text-gray-700 font-medium text-sm sm:text-base">{fileType || 'File'} Attachment</span>
                    </div>
                    <a
                      href={fileUrl}
                      download
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-transform duration-200 transform hover:scale-105"
                    >
                      <FaDownload className="mr-2 sm:mr-2" />
                      <span className="hidden sm:inline">Download</span>
                    </a>
                  </div>
                )}
                {post.content && (
                  <p className="text-gray-700 text-base leading-relaxed mt-4 whitespace-pre-line">{post.content}</p>
                )}
              </div>
            ) : (
              <div className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{post.content}</div>
            )}
          </div>
        </div>

        {/* Post actions */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mb-6 flex justify-between items-center">
          <div className="flex space-x-4 sm:space-x-6">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105"
              aria-label={liked ? 'Unlike post' : 'Like post'}
            >
              {liked ? <FaHeart className="text-red-600 text-xl" /> : <FaRegHeart className="text-xl" />}
              <span className="text-sm font-medium ml-1">{likeCount}</span>
            </button>
            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105"
              aria-label={showComments ? 'Hide comments' : 'Show comments'}
            >
              <FaComment className="text-xl" />
              <span className="text-sm font-medium ml-1">{comments.length}</span>
            </button>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 text-gray-600 hover:text-green-600 p-2 rounded-full hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105"
            aria-label="Share post"
          >
            <FaShare className="text-xl" />
            <span className="text-sm font-medium hidden sm:inline">Share</span>
          </button>
        </div>

        {/* Comments section */}
        {showComments && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {token && (
              <form onSubmit={handleAddComment} className="p-4 sm:p-6 border-b border-gray-200">
                
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm sm:text-base transition-colors duration-200"
                    aria-label="Add a comment"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform duration-200 transform hover:scale-105 text-sm font-medium"
                  >
                    Post
                  </button>
                </div>
              </form>
            )}
            {commentsLoading && (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-t-3 border-b-3 border-blue-600"></div>
              </div>
            )}
            {commentsError && (
              <div className="p-4 sm:p-6">
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm text-center">
                  <strong className="font-semibold">Error: </strong>
                  <span>{commentsError}</span>
                </div>
              </div>
            )}
            <div className="divide-y divide-gray-100">
              {comments.length === 0 ? (
                <p className="text-gray-500 text-center py-6 text-sm sm:text-base">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="p-4 sm:p-6 group hover:bg-gray-50 transition-colors duration-200">
                    <div className="flex items-start space-x-3">
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate(`/profile/${comment.user?._id}`)}
                      >
                        <img
                          src={comment.user?.profilepic || '/default-profile.png'}
                          alt={comment.user?.username}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-gray-100"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div
                            className="cursor-pointer"
                            onClick={() => navigate(`/profile/${comment.user?._id}`)}
                          >
                            <h4 className="font-semibold text-gray-900 text-sm sm:text-base hover:underline">
                              {comment.user?.fullname || comment.user?.username || 'Unknown user'}
                            </h4>
                            <p className="text-gray-700 mt-1 text-sm sm:text-base leading-relaxed">{comment.text}</p>
                          </div>
                          {(userData?.userid === comment.user?._id || userData?.userid === post.user._id) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteComment(comment._id);
                              }}
                              className="text-gray-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transform hover:scale-105"
                              title="Delete comment"
                              aria-label="Delete comment"
                            >
                              <FaTrash size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Post;
