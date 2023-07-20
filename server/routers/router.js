const express = require('express');
const Controller = require('../controllers/controller');
const { authentication, otorisasi } = require('../middlewares/autentikasi');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '/uploads');

// Ensure upload directory exists
fs.promises.mkdir(uploadDir, { recursive: true }).catch(console.error);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const fileName = new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname;
    cb(null, fileName);
  }
});

const upload = multer({ storage: storage });


router.post('/register', Controller.register)
router.post('/login', Controller.login)
router.post('/loginGoogle', Controller.loginGoogle);

router.get('/users/me', authentication, Controller.getUser)
router.put('/users/me', authentication, upload.single('profilePicture'), Controller.editUser)
router.post('/users/me/payment', authentication, Controller.getMitransToken)
router.patch('/users/me/subs', authentication, Controller.updateSubsStatus);


router.get('/posts', authentication, Controller.getAllPost)
router.post('/posts', authentication, Controller.addPost)
router.get('/posts/:id', authentication, Controller.getPost)
router.delete('/posts/:id', authentication, Controller.deletePost)
router.put('/posts/:id', authentication, Controller.editPost)

router.get('/posts/:id/comments', authentication, Controller.getCommentsForPost)
router.post('/posts/:id/comments', authentication, Controller.addComment)
router.put('/posts/:postId/comments/:commentId', authentication, Controller.editComment);
router.delete('/posts/:postId/comments/:commentId', authentication, Controller.deleteComment);

router.get('/memes', Controller.getMemes);
router.get('/stickers/fetch-and-save', Controller.fetchAndSaveStickers);

// Event endpoints
router.get('/events', authentication, Controller.viewEvents);
router.post('/events', authentication, otorisasi, Controller.createEvent);

router.get('/events/:eventId', authentication, Controller.viewEventDetails);
router.put('/events/:eventId', authentication, otorisasi, Controller.editEvent);
router.delete('/events/:eventId', authentication, otorisasi, Controller.deleteEvent);

router.post('/events/:eventId/participants', authentication, otorisasi, Controller.addParticipant); // Menambahkan partisipan ke event
router.delete('/events/:eventId/participants/:participantId', authentication, otorisasi, Controller.removeParticipant); // Menghapus partisipan dari event


module.exports = router