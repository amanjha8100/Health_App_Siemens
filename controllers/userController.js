const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const dbConnection = require("../utils/dbConnection");
const path = require('path');

//mongodb
const mongoose=require("mongoose");

const uri = "mongodb+srv://amanjha8100:anuragA00@cluster0.xkbdy.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const mongoFunc = async () =>{
    await mongoose.connect(uri, {
        useUnifiedTopology: true,
    }).then(() => console.log('mongoDB connected...'));    
}
mongoFunc();

//Schema definition

const user = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});


const User = mongoose.model("user",user);


// Home Page
exports.homePage = async (req, res, next) => {
    // const [...row] = await dbConnection.execute("SELECT * FROM `users` WHERE `id`=?", [req.session.userID]);
    const [...row] = await User.find({_id:req.session.userID});

    if (row.length !== 1) {
        return res.redirect('/logout');
    }

    res.render('home', {
        user: row[0]
    });
    //res.sendFile('../views/home.html');
    // res.sendFile('../views/home.html', function (err) {
    //     if (err) {
    //        // next(err);
    //     } else {
    //         console.log('Sent:', fileName);
    //     }
    // });
    //  res.sendFile(path.join(__dirname, '../views', 'home.html'));
}

// Register Page
exports.registerPage = (req, res, next) => {
    res.render("register");
};

// User Registration
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;

    if (!errors.isEmpty()) {
        return res.render('register', {
            error: errors.array()[0].msg
        });
    }

    try {

        // const [...row] = await dbConnection.execute(
        //     "SELECT * FROM `users` WHERE `email`=?",
        //     [body._email]
        // );

        const [...row] = await User.find({email:body._email});

        if (row.length >= 1) {
            return res.render('register', {
                error: 'This email already in use.'
            });
        }

        const hashPass = await bcrypt.hash(body._password, 12);

        // const [rows] = await dbConnection.execute(
        //     "INSERT INTO `users`(`name`,`email`,`password`) VALUES(?,?,?)",
        //     [body._name, body._email, hashPass]
        // );

        const newUser = new User({
            name: body._name,
            email:body._email,
            password:hashPass
        });

        await newUser.save().then(()=>{
            res.render("register", {
                msg: 'You have successfully registered.'
            });
        }).catch(e=>{
            res.render('register', {
                error: 'Your registration has failed.'
            });
        });

    } catch (e) {
        next(e);
    }
};

// Login Page
exports.loginPage = (req, res, next) => {
    res.render("login");
};

// Login User
exports.login = async (req, res, next) => {

    const errors = validationResult(req);
    const { body } = req;

    if (!errors.isEmpty()) {
        return res.render('login', {
            error: errors.array()[0].msg
        });
    }

    try {

        // const [...row] = await dbConnection.execute('SELECT * FROM `users` WHERE `email`=?', [body._email]);
        const [...row] = await User.find({email:body._email});

        if (row.length != 1) {
            return res.render('login', {
                error: 'Invalid email address.'
            });
        }

        const checkPass = await bcrypt.compare(body._password, row[0].password);

        if (checkPass === true) {
            req.session.userID = row[0].id;
            return res.redirect('/');
        }

        res.render('login', {
            error: 'Invalid Password.'
        });


    }
    catch (e) {
        next(e);
    }

}
