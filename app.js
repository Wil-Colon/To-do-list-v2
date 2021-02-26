//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
// const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
const _ = require('lodash');

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

//this will create new DB called todolistDB
mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});


//schema for the default items in to do list
const itemsSchema = ({
  name: String
});
// model for  default items in to do list
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + buttom to add a new item"
});

const item3 = new Item({
  name: "<-- Hit this button to delete an item."
});

const defaultItems = [item1, item2, item3];


//schema for custom lists, this embeds the itemsSchema in to the items array
const listSchema = {
  name: String,
  items: [itemsSchema]
};
// model for custom list
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  //To simplify our code, we got rid of the code for requiring date
  //above and deleting its folder containing the code. We changed listTitle to "Today".

  // const day = date.getDate();

  Item.find(function(err, foundItems) {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("All items inserted");
        }
      });
      res.redirect('/');
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const items = new Item({
    name: itemName
  });

  if (listName === "Today") {
    items.save();
    res.redirect('/');
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) {
      foundList.items.push(items);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log(checkedItemId + " deleted");
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
    }, (err, foundList) => {
      if (!err) {
        res.redirect(`/${listName}`);
      }
    });
  }
});



app.get('/:customListName', (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({
    name: customListName
  }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list if no list  found
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);

      } else {
        //Show an existing list if a list with same name as url is found
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

// app.get("/work", function(req, res) {
//   res.render("list", {
//     listTitle: "Work List",
//     newListItems: workItems
//   });
// });

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
