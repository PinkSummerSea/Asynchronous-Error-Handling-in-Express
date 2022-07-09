const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const AppError = require('./AppError');

const Product = require('./models/product');
const categories = ['fruit', 'vegetable', 'dairy'];

mongoose.connect('mongodb://localhost:27017/farmStand')
    .then(()=> {
        console.log('mongo connection open!')
    })
    .catch(err => {
        console.log('mongo connection error', err)
    })

app.use(express.urlencoded({extended: true}));
app.use(methodOverride((req, res) => {
    if (req.body && req.body._method) {
        return req.body._method
    }
}))

app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

function wrapAsync(fn) {
    return function(req, res, next) {
        fn(req, res, next).catch(e => next(e))
    }
}

app.get('/products', wrapAsync(async (req, res) => {
    const products = await Product.find({});
    res.render('products/index', { products })
}))

app.get('/products/new', (req, res) => {
    res.render('products/new', {categories})
})



app.post('/products', wrapAsync(async (req, res, next) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect('/products') 
}))





app.get('/products/:id', wrapAsync(async (req, res, next) => {
        const {id} = req.params;
        const product = await Product.findById(id);
        if (!product) {
            throw new AppError('No Product Found!', 404)
        }
        res.render('products/show', { product })
}))


app.get('/products/:id/edit', wrapAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        throw new AppError('No Product Found!', 404)
    }
    res.render('products/edit', { product, categories })
}))


app.patch('/products/:id', wrapAsync(async (req, res, next) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true });
    res.redirect(`/products/${product._id}`)
}))

const handleValidationErr = err => {
    console.dir(err);
    return new AppError(`Validation Failed. ${err.message}`, 400)
}

app.use((err, req, res, next) => {
    console.log(err.name);
    if (err.name === 'ValidationError') err = handleValidationErr(err);
    next(err)
})

app.use((err, req, res, next) => {
    const { message = 'Something went wrong', status = 500 } = err;
    res.status(status).send(message);
})

app.listen(3000, () => {
    console.log('app is listening on port 3000')
})