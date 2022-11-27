import express from 'express';
import engine from 'ejs-mate';
import path from 'path';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import flash from 'connect-flash';

module.exports = app => {
    //settings
    app.set('views', path.join(__dirname, '../views'));
    app.engine('ejs', engine);
    app.set('view engine', 'ejs');

    app.set('port', process.env.PORT || 3000);

    //middlewares
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));
    app.use(session({
        secret: 'api-vending-session-secret',
        resave: false,
        saveUninitialized: false
    }));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());

    app.use((req, res, next) => {
        app.locals.signupMessage = req.flash('signupMessage');
        app.locals.signinMessage = req.flash('signinMessage');
        app.locals.configErrorMessage = req.flash('configErrorMessage');
        app.locals.configMessage = req.flash('configMessage');
        app.locals.user = req.user;
        next();
    });
};