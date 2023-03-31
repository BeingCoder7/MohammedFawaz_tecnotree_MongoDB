const MongoClient = require('mongodb').MongoClient;
const express = require('express')
const app = express()
const bodyParser = require('body-parser');
const User = require("./Schemas/userSchema")
const Post = require("./Schemas/PostSchema")
const Comment = require("./Schemas/CommentSchema")
const session = require('express-session');
const { collection } = require('./Schemas/userSchema');
const MongoDBStore = require('connect-mongodb-session')(session);
const ObjectId = require('mongodb').ObjectId; 


const uri = "mongodb+srv://mohammedfawaz507:fawaz123@cluster0.jitf2im.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});

const store = new MongoDBStore({
  uri:"mongodb+srv://mohammedfawaz507:fawaz123@cluster0.jitf2im.mongodb.net/?retryWrites=true&w=majority",
  collection: 'session'
});

// Catch errors
store.on('error', function(error) {
  console.log(error);
});

app.set('view engine', 'ejs');
app.use(require('express-session')({
  secret: 'This is a secret',
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  },
  store: store,
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 


function authenticateSession(req,res,next){
  if(req.session.user){
    next();
  }else{
    res.redirect("/login")
  }
}


function notauthenticateSession(req,res,next){
  if(!req.session.user){
    next();
  }else{
    res.redirect('/Home')
  }
}


client.connect()
  .then(() => {
    const signup = client.db("Blogging").collection("users");
    const post = client.db("Blogging").collection("post");
    const comment = client.db("Blogging").collection("comment");
 
    app.get("/",notauthenticateSession,(req,res)=>{
        res.render("home")
      })

    app.get("/register",notauthenticateSession,(req,res)=>{
        res.render("register")
      })
    
    app.post('/register',notauthenticateSession, async(req, res) => {
        const { username, email, password } = req.body;
        const user = new User({ username, email, password });
        const checkUser = await signup.findOne({username})
        console.log(user)
        if(!checkUser){
        try {
            await signup.insertOne(user)
        //    user.save();
          res.redirect('/login')
        } catch (error) {
          res.status(400).json({ error: error.message });
        }}
        else{
          res.json("Username aleready taken")
        }
      });

      app.get("/login",notauthenticateSession,(req,res)=>{
        res.render("login")
      })

      
      app.post('/login',notauthenticateSession, async (req,res)=>{
        const {username,password} = req.body;
        const user = await signup.findOne({username})
        console.log(user)
        if(!user){
          return res.status(401).json({message:"Invalid username or password"})
        }
        const validPassword = user.password
        if(validPassword != password){
          return res.status(401).json({message:"Invalid username or password"})
        }

        req.session.user = user
        res.redirect('/Home')
      })


      app.get("/Home",authenticateSession,(req,res)=>{
        res.render("authhome")
        let user = req.session.user
      })


     app.post('/post',authenticateSession, async (req, res) => {
        try {
          const { title, content} = req.body;
          const authId = req.session.user
          const newPost = new Post({
            title,
            content,
            author:authId._id.toString()
          });
      
      
      await post.insertOne(newPost);
      res.render("allpost")
          
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Server error' });
        }
      });

      app.get('/mypost', authenticateSession, async (req, res) => {
        try {
          const user = req.session.user;
          const userId = user._id.toString();
          
          console.log(`ObjectId('${userId}')`)

          // let list = await db.Blogging.post.find()
          console.log(list)
          res.render('allpost', { list });
        } catch (err) {
          console.error(err);
          res.status(500).json({ message: 'Server error' });
        }
      });
      
      
      

    console.log("Connected");

    app.listen(3000,(req,res)=>{
        console.log("Listening at Port 3000")
      })

      app.get('/logout',authenticateSession, (req, res) => {
        req.session.destroy();
        res.redirect('/');
      });

  })
  .catch(err => console.error(err));


 
  

