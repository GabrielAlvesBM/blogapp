const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');

require('../models/User');
const User = mongoose.model('users');

router.get('/register', (req, res) => {
    res.render('users/register');
});

router.post('/register', (req, res) => {
    let errors = [];

    if (!req.body.name || typeof req.body.name === undefined || req.body.name === null) {
        errors.push({ text: 'Nome Invalido!' });
    };

    if (!req.body.email || typeof req.body.email === undefined || req.body.email === null) {
        errors.push({ text: 'E-mail Invalido!' });
    };

    if (!req.body.password || typeof req.body.password === undefined || req.body.password === null) {
        errors.push({ text: 'Senha Invalida!' });
    };

    if (req.body.password.length < 4) {
        errors.push({ text: 'Senha muito curta!' });
    };

    if (req.body.password != req.body.confirmPassword) {
        errors.push({ text: 'As senhas são diferentes, tente novamente!' });
    };

    if (errors.length > 0) {
        res.render('users/register', { errors: errors });
    } else {
        User.findOne({ email: req.body.email }).then((user) => {
            if (user) {
                req.flash('error_msg', 'Já existe uma conta com este e-mail no nosso sistema');
                res.redirect('/users/register');
            } else {
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password
                });

                bcrypt.genSalt(10, (error, salt) => {
                    bcrypt.hash(newUser.password, salt, (error, hash) => {
                        if (error) {
                            req.flash('error_msg', 'Houve um erro durante o salvamento do usuário');
                            res.redirect('/');
                        }

                        newUser.password = hash;

                        newUser.save().then(() => {
                            req.flash('success_msg', 'Usuário criado com sucesso!');
                            res.redirect('/');
                        })
                        .catch(() => {
                            req.flash('error_msg', 'Houve um erro ao criar o usuário, tente novamente');
                            res.redirect('users/register');
                        });
                    });
                });
            };
        })
        .catch(() => {
            req.flash('error_msg', 'Houve um erro interno');
            res.redirect('/');
        });
    }
});

router.get('/login', (req, res) => {
    res.render('users/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

router.get('/logout', (req, res, next) => {
    req.logout((error) => {
        if (error) {
            return next(error);
        }

        req.flash('success_msg', 'Deslogado com sucesso!');
        res.redirect('/');
    });
});

module.exports = router;