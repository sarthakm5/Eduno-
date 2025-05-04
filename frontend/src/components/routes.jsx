import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Layout from './layout';
import Login from './login';
import SignUp from './signup';
import ProfilePage from './profilepage';
import UploadProfilePic from './uploadprofilepic';
import Notification from './notification';
import PostUpload from './postupload';
import Homepage from './homepage';
import { Navigate } from 'react-router-dom';
import Post from '../components/post';
import AdDob from '../components/addob'
import Explore from './explore'

function RouterComponent() {
  return (
    <Router>
      <Routes>
      
        <Route path="/" element={<Layout />}>
          <Route index element={<Homepage />} />
          <Route path="home" element={<Homepage />} />
          <Route path="explore" element={<Explore />} /> 
          <Route path="notifications" element={<Notification />} />
          
          <Route path="profile/:userid" element={<ProfilePage />} />
          
          <Route path="create-post" element={<PostUpload standalone={true} />} />
          
        </Route>


        <Route path="/addob" element={<AdDob />} />
        <Route path="/uploadprofilepic" element={<UploadProfilePic />} />
        <Route path="/show-post/:postid" element={<Post/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default RouterComponent;