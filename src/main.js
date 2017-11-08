// Require packages

const passportLocalMongoose     = require('passport-local-mongoose'),
bodyparser                      = require('body-parser'),
express                         = require('express'),
Chart                           = require('chart.js'),
mongoose                        = require('mongoose'),
passport                        = require('passport'),
LocalStrategy                   = require('passport-local').Strategy,
app                             = express();

// Require local files
const middleware  = require('./middleware/index.js'),
config            = require('../config/global.config.json'),
userData          = require('./schemas/userSchema.js'),
workoutData       = require('./schemas/workoutSchema.js'),
userFactory       = require('./services/userFactory.js'),
workoutFactory    = require('./services/workoutFactory.js');

// Database stuff
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/mm_fitness_app', {useMongoClient: true});
const db = mongoose.connection;

// Make user-schema
const userSchema = mongoose.Schema(userData);
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User', userSchema);

// Make workout-schema
const workoutSchema = mongoose.Schema(workoutData);
const Workout = mongoose.model('Workout', workoutSchema);

// Setup
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(require('express-session')({
    secret: "MM-Fitness er den vildeste app nogensinde!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Serialize & deserialize the user in the session
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Uncomment this method for test data, specify amount of users
userFactory.testData(User, 10);
// workoutFactory.createNewWorkout(Workout, "bænkpres");


// ===============================================================
// ROUTES 
// ===============================================================

// Root route
app.get('/', (req, res) => {
    res.render('login'); 
});

app.get('/home', middleware.isLoggedIn, (req, res) => {
    const user = req.user;
    res.render('home', {user: user});
});

// Profile
app.get('/profile', middleware.isLoggedIn, (req, res) => {
    const user = req.user;
    res.render('profile', {user: user});
});

// Training program
app.get('/program', middleware.isLoggedIn, (req, res) => {
    const user = req.user;
    //console.log(JSON.stringify(user, null, 3));
    res.render('program', {user: user});
});

// Meal plan
app.get('/meal-plan', middleware.isLoggedIn, (req, res) => {
    res.render('meal-plan');
});

// Inbox
app.get('/inbox', middleware.isLoggedIn, (req, res) => {
    res.render('inbox');
});

// News
app.get('/news', middleware.isLoggedIn, (req, res) => {
    res.render('news');
});

// Update weight route
app.post('/update/weight', middleware.isLoggedIn, (req, res) => {
    const newWeight = req.body.weight;
    userFactory.updateWeight(newWeight, req.user, User);
    res.redirect('/home');
});

app.get('/workout/:name', middleware.isLoggedIn, async (req, res) => {
    const name = req.params.name;
    try {
        Workout.findOne({name: name}, (err, workoutFromDb) => {
            res.render('workout', {workout: workoutFromDb});
        }).exec();
    } catch (err) {
        throw(err);
    }
});

// ===============================================================
// AUTH ROUTES
// ===============================================================

// Show signup form
app.get('/register', (req, res) => {
    res.render('register');
});

// Handling user signup
app.post('/register', (req, res) => {
    req.body.username;
    req.body.password;
    User.register(new User({username: req.body.username}), req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render('register');
        }
        passport.authenticate('local')(req, res, function(){
            res.redirect('/home')
        });
    });
});

// ===============================================================
// LOGIN ROUTES
// ===============================================================

// Render login form
app.get('/login', (req, res) => {
    res.render('login');
});

// Login logic w. middleware
app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login'
}), (req, res) => {
    // Some function to callback
});

// Logout route
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

// Server listening
app.listen(config.port, () => {
    console.log("Server listening on port " + config.port);
});