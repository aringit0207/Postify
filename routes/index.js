var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require('./posts');
const passport = require('passport');
const upload = require('./multer');

const fs = require('fs');
const path = require('path');

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/login', function(req, res, next) {
  res.render('login', {error: req.flash('error')});
});

router.get('/feed', async function(req, res, next) {
  try {
    // Fetch all posts from the database
    const posts = await postModel.find({}).populate('user');
    
    // Shuffle the posts array randomly
    const shuffledPosts = posts.sort(() => Math.random() - 0.5);

    // Pass shuffled posts to the feed.ejs page
    res.render('feed', { posts: shuffledPosts });
  }
  catch(err) {
    res.status(500).send('Error fetching posts');
  }
});

router.post('/upload', isLoggedIn, upload.single("file"), async function(req, res, next) {
  if(!req.file) return res.status(404).send('No files were uploaded.');

  // file which is uploaded, save it as a post and give its postid to user and userid to this post
  const user = await userModel.findOne({username: req.session.passport.user});
  const post = await postModel.create({
    image: req.file.filename,
    imageText: req.body.filecaption,
    user: user._id
  });

  user.posts.push(post._id);
  await user.save();
  
  res.redirect("/profile");
});

router.post('/posts/:id/delete', async (req, res) => {
  try {
    const post = await postModel.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    // Delete the image file
    const imagePath = path.join(__dirname, '../public/images/uploads', post.image);
    fs.unlink(imagePath, err => err && console.error('Error deleting image:', err));

    res.redirect('/profile');
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
  }
});


router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  })
  .populate("posts");
  res.render("profile", {user});
});

router.post("/register", function(req, res) {
  const { username, email, fullname } = req.body;
  const userData = new userModel({ username, email, fullname });

  userModel.register(userData, req.body.password)
  .then(function() {
    passport.authenticate("local")(req, res, function() {
      res.redirect("/profile");
    })
  })
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true
}), function(req, res){
});

function isLoggedIn(req, res, next) {
  if(req.isAuthenticated()) return next();
  return res.redirect("/login");
}

module.exports = router;