const express = require('express');
const router = express.Router();
const { uploadFile, uploadFiles } = require('../middleware/multer');
const multer = require('multer');
const getUserid = require('../controllers/getuserid');
const Post = require('../controllers/post');
const userRegister = require('../controllers/userregister');
const login = require('../controllers/userlogin');
const { homepage, deletePost } = require('../controllers/homepage');
const userfollow = require('../controllers/userfollow');
const userlike = require('../controllers/userlike');
const explore=require('../controllers/explore')
const { addComment, deleteComment } = require('../controllers/postcomment');
const getComments = require('../controllers/fetchcomments');
const { uploadprofilepic } = require('../controllers/uploadprofilepic');
const followrequestacception = require('../controllers/acceptfollowrequest');
const updateprofile=require("../controllers/updateprofile")
const getUser = require('../controllers/getUser');
const { uploadDocument } = require('../controllers/postupload');
const profilepage = require('../controllers/profile');
const { notification, clearNotifications } = require('../controllers/notification');
const updateprofilepic = require("../controllers/updateprofilepic");
const addob=require("../controllers/adddob")

const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(500).json({ error: err.message });
  }
  next();
};

router.route('/post').post(Post);
router.route('/addob').post(addob)
router.route('/register').post(userRegister);
router.route('/login').post(login);
router.route('/explore').get(explore)
router.route('/profileupload').post(uploadFile, uploadprofilepic, handleUploadErrors);
router.route('/updateprofilepic').post(uploadFile, updateprofilepic, handleUploadErrors); 
router.route('/user').post(getUser);
router.post('/postupload', uploadFiles, uploadDocument, handleUploadErrors);
router.post('/home', homepage);
router.delete('/posts/:postId', deletePost);
router.route('/profilepage').post(profilepage);
router.route('/userfollow').post(userfollow);
router.route('/acceptrequest').post(followrequestacception);
router.route('/userlike').post(userlike);
router.route('/getuserid').post(getUserid);
router.route('/posts/comments').post(addComment);
router.route('/get/comments').get(getComments);
router.route('/notification').post(notification);
router.route('/clearnotifications').post(clearNotifications);
router.route('/updateprofile').post(updateprofile)
router.route('/posts/commentsdelete/:postid/:commentid').delete(deleteComment);

module.exports = router;