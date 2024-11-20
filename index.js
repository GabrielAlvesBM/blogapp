const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
require('./config/auth')(passport);
const db = require('./config/db');
require('dotenv').config();

const admin = require('./routes/admin');
const users = require('./routes/user');

require('./models/Post');
require('./models/Category');
const Post = mongoose.model('posts');
const Category = mongoose.model('categories');

app.use(session({
    secret: 'Secret Secreta porra!',
    resave: true,
    saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
})

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.engine(
  "handlebars",
  handlebars.engine({
    defaultLayout: "main",
    runtimeOptions: {
      allowProtoPropertiesByDefault: true,
      allowProtoMethodsByDefault: true,
    },
  })
);
app.set('view engine', 'handlebars');

mongoose.Promise = global.Promise;
mongoose.connect(db.mongoURI).then(() => {
    console.log('Mongodb Conectado!');
})
.catch((error) => {
    console.error('Erro ao conectar no mongodb: ' + error);
})

app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.get('/', (req, res) => {
  Post.find().populate('category').sort({ date: 'asc' }).then((posts) => {
    res.render('index', { posts: posts });
  })
  .catch(() => {
    req.flash('error_msg', 'Houve um erro interno');
    res.redirect('/404');
  });
});

app.get('/post/:slug', (req, res) => {
  Post.findOne({ slug: req.params.slug }).then((post) => {
    if (!post) {
      req.flash('error_msg', 'Essa postagem não existe');
      req.redirect('/');
    };
    
    res.render('post/index', { post: post });
  })
  .catch(() => {
    req.flash('error_msg', 'Houve um erro interno');
    res.redirect('/');
  });
});

app.get('/categories', (req, res) => {
  Category.find().then((category) => {
    res.render('categories/index', { categories: category });
  })
  .catch(() => {
    req.flash('error_msg', 'Houve um erro interno ao listar as categorias');
    res.redirect('/')
  });
});

app.get('/categories/:slug', (req, res) => {
  Category.findOne({ slug: req.params.slug }).then((category) => {
    if (!category) {
      req.flash('error_msg', 'Está categoria não existe');
      res.redirect('/categories');
    };
    
    Post.find({ category: category._id }).then((post) => {
      res.render('categories/posts', { posts: post, categories: category })
    })
    .catch(() => {
      req.flash('error_msg', 'Houve um erro ao listar os posts!');
      res.redirect('/categories');
    });
  })
  .catch(() => {
    req.flash('error_msg', 'Houve um erro interno ao carregar a página desta categoria');
    res.redirect('/categories');
  });
});

app.use('/admin', admin);
app.use('/users', users);

app.get('/404', (req, res) => {
  res.send('Erro 404!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log('Servidor Rodando!');
});