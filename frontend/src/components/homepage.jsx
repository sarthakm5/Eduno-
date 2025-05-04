import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const Homepage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem("edunotoken");
      const res = await axios.post(`${import.meta.env.VITE_API}/api/home`, { token }); 
      if (res.data.success) {
        setPosts(res.data.posts);
        setIsAdmin(res.data.isAdmin || false);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId, e) => {
    e.stopPropagation(); // Prevent navigating to post page
    try {
      const token = localStorage.getItem("edunotoken");
      if (window.confirm("Are you sure you want to delete this post?")) {
        await axios.delete(`${import.meta.env.VITE_API}/api/posts/${postId}`, {
          data: { token }
        });
        // Remove the post from local state
        setPosts(posts.filter(post => post._id !== postId));
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/show-post/${postId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-center">Recent Posts</h1>
      
      {posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No posts available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div
              key={post._id}
              onClick={() => handlePostClick(post._id)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] hover:shadow-lg relative"
            >
            
              {(isAdmin || post.canDelete) && (
                <button
                  onClick={(e) => handleDeletePost(post._id, e)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                  title="Delete post"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}

              
              <div className="h-48 w-full overflow-hidden">
                {post.contentType === 'text' ? (
                  <div className="h-full w-full bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {post.content}
                    </p>
                  </div>
                ) : (
                  <img
                    src={post.thumbnail || post.fileUrl|| "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAACUCAMAAADGZBfIAAAAMFBMVEXMzMz////IyMj4+Pj7+/vi4uLR0dHr6+vW1tbu7u7l5eXy8vLb29ve3t719fXFxcUDTORLAAADQElEQVR4nO2a25KrIBBFud/B///b0w2aOGaMVXk4kam9nkxLLJaNXEQhAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8Pcp9gL37Rp+hPLyCh2+XclPCJdeUuZvV/IDVLpMiJd6wsbIYu+rfV3ilmzVLimVkyIzi6lk6FFKvxeZWcyNTqL+WmRisSUNMf+Mu2ePMrOYP4q5/EzfxGJqHczsI9zoV1HjeGIxISJ7xUe0/zRrNzm1mKg5P9oetcN9ZzK3mCLW0MOLzDg2t9iOp9d4zuYXS/1g79Wfs+nFWp/F//DiJcvkc8VhlN3Ba34xF4fHcSk2vVg8WWNOLqaOLfCPiKmzfEHsfozZ/V8Vo4yZE+YWe1/Ezium3rFMmrFK8w3/Fi3bhGJCvEw2XrHXV7kjsV1Q1fVF7sik1QYAAADA7VEfTTTuOjdx2iqRNR9lY7Lr9VwXl3aJ/NWAjrytSZPdoJNSltaX/ILHC1F5scmbE1bSyRbHy/y+D6P5/ep+s/C/44wmMUMyjZYo2+rKxiajL4s3JMZbSKGLGU9ivB2hDAct/aPJKijml2BYTOmxW63b98VkUSxG9ed147rvRWtMSp76XSwpIYdYWFzLHDNqiAkzvmi5gZiWvosFrkaR9rFV6cSJmI4qSNPF6DZEPbI4xILU5iZixjS3F1vjm5hbFnMQi1kkrYfY4lbZ3MVU1Z7/eAuxHNO5mMwxHjNmtYtxiLV+ssesZrHYiqk3EYslt3Mx3dpRrObQ6miKOpscWKzG3Jsi9asseA8xeszOm2Jx7kUsJhOGWKUuP7NYKdSdkJDMVpvlHmKZRy2hzjuP8Yyl7t7FPDXdtfNQIsouRneHxEp/vyNuIrZUzphbay1exDhjdJbfxtU1O/oplmX/G7XaqBQPF16Gu4g53QdoY8tuz3knlh3v/dmqKcZigcaqIZaKZ2MWK5yxTOnrWR9iuZSvfYBKlVR0t/moSdken+8NsShXMRGylDx96mImURodiRHe9YdNCRqp6Q4pSm4mMS3G12X5a3PJ4LavvlwIz7e6W4hL/DjLITriIIW2c25cKGzl14P9FQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAz/wDadh/GurogBAAAAABJRU5ErkJggg=="}
                    alt={post.heading}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>

      
              <div className="p-4">
               <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
  {post.heading.length > 20 ? `${post.heading.substring(0, 32)}...` : post.heading}
</h2>
                
              
                <div className="flex items-center mt-4">
                  <img
                    src={post.user.profilePic}
                    alt={post.user.username}
                    className="w-8 h-8 rounded-full object-cover mr-2"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-700">{post.user.username}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Homepage;
