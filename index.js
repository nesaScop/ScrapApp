const express = require("express");
const puppeteer = require('puppeteer');
const ejs = require("ejs");
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const exjwt = require('express-jwt');
const User = require('./models/user');
const bodyParser = require('body-parser');
const path = require('path');

const jwtMW = exjwt({
    secret: 'secret key',
    algorithms: ['sha1', 'RS256', 'HS256'],
})

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));



mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect('mongodb+srv://nesascop:stalker1243@cluster0.q004s.mongodb.net/node-base?retryWrites=true&w=majority')
    .then(console.log('Connected to database'));
mongoose.Promise = global.Promise;


app.set('views', path.join(__dirname, '/views'));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function(req, res){
    res.render('index');
})

app.get('/scrape', function(req, res){
    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto('https://www.wowprogress.com/', { waitUntil: 'domcontentloaded' });

        const ratingTable = await page.evaluate(() => {
            return document.querySelector('table.rating').innerHTML;
            ;
        });

        await browser.close();

        res.json({innerHTML: ratingTable});
    })();
});

app.get('/login1', function(req, res){
    res.render('login1.ejs');
});

app.post('/register', function(req, res){
    const mail = req.body.mail;
    const password = req.body.password;

    User.create({
        mail: mail,
        password: password
    }).then((user) => {
        console.log('Created user: ', user);
        res.send('user successfully created');
    });
});

app.post('/login', function(req, res){
    const mail = req.body.mail;
    const password = req.body.password;

    User.findOne({ mail: mail }).then((user) => {
        if(!user){
            return res.json({
                error: true,
                message: 'Korisnik nije pronadjen'
            });
        }

        else if(password != user.password){
            return res.json({
                error: true,
                message: 'Pogresna lozinka'
            });
        }

        else{
            let token = jwt.sign({ id: user._id, mail: mail }, 'secret key', { expiresIn: 129600 });
            return res.json({
                error: false,
                token: token
            });
        }
    });
});


app.listen(3000,function(){
    console.log("slusa");
});
