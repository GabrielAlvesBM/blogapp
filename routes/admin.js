const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { isAdmin } = require('../helpers/isAdmin');

require('../models/Category');
require('../models/Post');
const Category = mongoose.model('categories');
const Post = mongoose.model('posts');


router.get('/', isAdmin, (req, res) => {
    res.render('admin/index');
});

router.get('/categories', isAdmin, (req, res) => {
    Category.find().sort({ date: 'desc' }).then((categories) => {
        res.render('admin/categories', { categories: categories });
    })
    .catch(() => {
        res.flash('error_msg', 'Houve um erro ao listar as categorias');
        res.redirect('/admin');
    }) 
});

router.get('/categories/add', isAdmin, (req, res) => {
    res.render('admin/addcategories');
});

router.post('/categories/new', isAdmin, (req, res) => {
    let errors = [];

    if (!req.body.name || typeof req.body.name == undefined || req.body.name == null ) {
        errors.push({ text: 'Nome Invalido' });
    };

    if (!req.body.slug || typeof req.body.slug == undefined || req.body.name == null) {
        errors.push({ text: 'Slug Invalido' });
    };

    if (req.body.name.length < 2) {
        errors.push({ text: 'Nome muito curto' });
    };

    if (req.body.slug.length < 2) {
        errors.push({ text: 'Slug muito curto' });
    };

    if (errors.length > 0) {
        res.render('admin/addcategories', {errors: errors});
    } else {
        const newCategorie = {
            name: req.body.name,
            slug: req.body.slug
        };
    
        new Category(newCategorie).save().then(() => {
            console.log('Categoria salva com sucesso!');
            req.flash('success_msg', 'Categoria criada com sucesso!');
            res.redirect('/admin/categories');
        })
        .catch((error) => {
            req.flash('error_msg', 'Houve um erro ao salvar a categoria, tente novamente!')
            res.redirect('/admin');
        })
    }
});

router.get('/categories/edit/:id', isAdmin, (req, res) => {
    Category.findOne({ _id: req.params.id }).then((category) => {
        res.render('admin/editcategories', { category: category });
    })
    .catch(() => {
        req.flash('error_msg', 'Essa categoria não existe');
        res.redirect('/admin/categories');
    })
});

router.post('/categories/edit', isAdmin, (req, res) => {
    Category.findOne({ _id: req.body.id }).then((category) => {
        category.name = req.body.name;
        category.slug = req.body.slug;

        category.save().then(() => {
            req.flash('success_msg', 'Categoria editada com sucesso!');
            res.redirect('/admin/categories');
        })
        .catch(() => {
            req.flash('error_msg', 'Houve um erro interno ao salvar a edição da categoria');
            res.redirect('/admin/categories');
        })
    })
    .catch(() => {
        req.flash('error_msg', 'Houve um erro ao editar categoria');
        res.redirect('/admin/categories');
    });
});

router.post('/categories/delete', isAdmin, (req, res) => {
    Category.findByIdAndDelete( req.body.id ).then(() => {
        req.flash('success_msg', 'Categoria deletada com sucesso!');
        res.redirect('/admin/categories');
    })
    .catch(() => {
        req.flash('error_msg', 'Houve um erro ao deletar a categoria');
        res.redirect('/admin/categories');
    });
});

router.get('/posts', isAdmin, (req, res) => {
    Post.find().populate('category').sort({ date:'desc' }).then((posts) => {
        res.render('admin/posts', { posts: posts }); 
    })
    .catch((error) => {
        req.flash('error_msg', 'Houve um erro ao listar as postagens: ' + error);
        res.redirect('/admin');
    });
});

router.get('/posts/add', isAdmin, (req, res) => {
    Category.find().then((category) => {
        res.render('admin/addposts', { category: category });
    })
    .catch((error) => {
        req.flash('error_msg', 'Houve um erro ao carregar o formulario');
        res.redirect('/admin');
    });
});

router.post('/posts/new', isAdmin, (req, res) => {
    let errors = [];

    if (req.body.category === '0') {
        errors.push({ text: 'Categoria Invalida, registre uma categoria' })
    };

    if (errors.length > 0) {
        res.render('admin/addposts', {errors: errors});
    } else {
        const newPost = {
            title: req.body.title,
            description: req.body.description,
            content: req.body.content,
            category: req.body.category,
            slug: req.body.slug
        };

        new Post(newPost).save().then(() => {
            req.flash('success_msg', 'Postagem criada com sucesso!');
            res.redirect('/admin/posts');
        })
        .catch(() => {
            req.flash('error_msg', 'Houve um erro ao cadastrar a postagem');
            res.redirect('/admin/posts');
        });
    };
});

router.get('/posts/edit/:id', isAdmin, (req, res) => {
    Post.findOne({ _id: req.params.id }).then((post) => {
        Category.find().then((category) => {
        res.render('admin/editposts', { category: category, post: post });
        })
        .catch(() => {
            req.flash('error_msg', 'Houve um erro ao listar as categorias');
            res.redirect('/posts')
        });
    })
    .catch(() => {
        req.flash('error_msg' ,'Houve um erro ao carregar o formulário de edição');
        res.redirect('/posts')
    })
});

router.post('/posts/edit', isAdmin, (req, res) => {
    Post.findOne({ _id: req.body.id }).then((post) => {
        post.title = req.body.title;
        post.slug = req.body.slug;
        post.description = req.body.description;
        post.content = req.body.content;
        post.category = req.body.category;

        post.save().then(() => {
            req.flash('success_msg', 'Postagem editada com sucesso!');
            res.redirect('/admin/posts');
        })
        .catch((error) => {
            console.log(error);
            req.flash('error_msg', 'Erro interno');
            res.redirect('/admin/posts');
        })
    })
    .catch(() => {
        req.flash('error_msg', 'Houve um erro ao salvar a edição');
        res.redirect('/admin/posts')
    });
});

router.get('/posts/delete/:id', isAdmin, (req, res) => {
    Post.deleteOne({ _id: req.params.id }).then(() => {
        req.flash('success_msg', 'Postagem deletada com sucesso!');
        res.redirect('/admin/posts');
    })
    .catch(() => {
        req.flash('error_msg', 'Houve um erro interno');
        res.redirect('/admin/posts');
    });
});

module.exports = router;