const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Joi = require("joi");
const catchAsync = require("./utils/catchAsync");
const ExpressError = require("./utils/ExpressError");
const Campground = require("./models/campground");

mongoose.connect("mongodb://localhost:27017/yelp-camp")

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database Connected");
})

const app = express();


app.engine('ejs', ejsMate)
app.set("view engine", "ejs" );
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extnede: true}));

app.use(methodOverride("_method"));

app.get('/', (req,res) => {
    res.render("home");
})

app.get('/campgrounds', catchAsync ( async (req,res) => {
    const campgrounds = await Campground.find({});
    res.render("campgrounds/index" , { campgrounds })
}));

app.get("/campgrounds/new", (req, res) => {
    res.render("campgrounds/new")
})

app.post("/campgrounds", catchAsync( async(req, res, next) => {
    // if(!req.body.campground) throw new ExpressError("Invalid Campground Data", 400)
    const campgroundScheam = Joi.object({
        campground: Joi.object({
            title: Joi.string().required(),
            price: Joi.number().required().min(0),
            image: Joi.string().required(),
            location: Joi.string.required()
        }).required()
    })
    const { error } = campgroundScheam.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(",")
        throw new ExpressError(result.error.details, 400)
    }
    console.log(result);
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`)
}))

app.get("/campgrounds/:id" , catchAsync (async(req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render("campgrounds/show" , { campground });
}));

app.get("/campgrounds/:id/edit", catchAsync( async(req, res) => {
    const campground = await Campground.findById(req.params.id)
    res.render("campgrounds/edit" , { campground });
}));

app.put("/campgrounds/:id",catchAsync (async(req, res) => {
    res.send("IT Worked");
}));

app.delete("/campgrounds/:id",catchAsync (async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
}));

app.all("*", (req, res, next) => {
    next(new ExpressError("Page Not Found"), 404)
})

app.use((err, req, res, next) => {
    const { statusCode = 500} = err;
    if (!err.message) err.message = "Something went wrong"
    res.status(statusCode).render("error", { err })
})

app.listen(3000, () => {
    console.log("Serving on the port 3000")
})