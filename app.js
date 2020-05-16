//jshint esversion:6
// Requiring packages
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");
const date = require(__dirname + "/date.js");

const app = express();

// Setting view engine
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static("public"));

// Connecting to mongoose
mongoose.connect('mongodb+srv://laksh:test123@todo-list-project-27lqd.mongodb.net/todolistDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Creating a mongoose schema
const itemSchema = new mongoose.Schema({
    name: String
});

// Creating a model
const Item = mongoose.model('Item', itemSchema);

// Creating the default items
const item1 = new Item({
    name: 'Delete this after adding 1 item.'
});

const defaultItems = [item1];

// Creating schema for custom list
const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
});

// Creating model for custom list
const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {
    const day = date.getDate();
    // Reading items to our app
    Item.find({}, function (err, foundItems) {
        if (foundItems.length === 0) {
            // Inserting default items
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log('Added default items');
                }
            });
            res.redirect('/');
        } else {
            res.render("list", {
                listTitle: day,
                listItems: foundItems
            });
        }
    });
});

app.get("/:customListName", function (req, res) {
    const customListName = lodash.capitalize(req.params.customListName);
    List.findOne({
        name: customListName
    }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                // Create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect('/' + customListName);
            } else {
                // Show an existing list
                res.render('list', {
                    listTitle: foundList.name,
                    listItems: foundList.items
                });
            }
        }
    });
});

// Adding a custom item
app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if (listName === 'Today') {
        // Default list
        item.save();
        res.redirect('/');
    } else {
        // Custom List
        List.findOne({
            name: listName
        }, function (err, foundList) {
            foundList.items.push(item);
            foundList.save();
            res.redirect('/' + listName);
        });
    }
});

// Deleting an item
app.post("/delete", function (req, res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    if (listName === 'Today') {
        // Default list
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log('Successfully Deleted Checked Item.');
                res.redirect('/');
            }
        });
    } else {
        List.findOneAndUpdate({
            name: listName
        }, {
            $pull: {
                items: {
                    _id: checkedItemId
                }
            }
        }, function (err, foundList) {
            if (!err) {
                res.redirect('/' + listName);
            }
        });
    }
});

app.get("/about", function (req, res) {
    res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
    port = 3000;
}

app.listen(port, function () {
    console.log("Server has started successfully.");
});