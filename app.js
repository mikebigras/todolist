const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js")
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));

app.use(bodyParser.urlencoded({extended: true}));

// const uri = "mongodb://localhost:27017/todolistDB";
const uri = "mongodb+srv://mbigrasnui:Bajor001@cluster0.ovftfxu.mongodb.net/todolistDB?retryWrites=true&w=majority";

mongoose.set('strictQuery', false);
mongoose.connect(uri);

// Logic to check that the database is connected properly
mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log('Database connected');
});

const today = "Today";

const itemsSchema = new mongoose.Schema({
  name: {
      type: String,
      required: [true, "Please check your data entry, no name specified!"] 
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!",
});

const item2 = new Item ({
  name: "Hit the + button to add a new Item.",
});

const item3 = new Item ({
  name: "<-- Hit this to delete a item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

async function insertDefaultItems() {

  await Item.insertMany(defaultItems).then(function(){
    console.log("Succesfully saved all the items to todolistDB");
  }).catch(function (err){
    console.log(err);
  });
 
}

async function findItems() {

  let itemsArray = [];

  const itemsList = await Item.find();
  itemsList.forEach((item) => {
    record = { 
      id: item._id,
      name: item.name
       }
    itemsArray.push(record);
  });
  return itemsArray;
}

app.get("/", function(req, res){
    
    let itemsFound = findItems();
    itemsFound.then(function(list) {
      if (list.length === 0) {
        insertDefaultItems();
        itemsFound = findItems();
        itemsFound.then(function(list) {
          res.render('list', {listTitle: today, itemList:list});   
        });
      } else {
        res.render('list', {listTitle: today, itemList:list});
      }
      
    });
});

app.post("/", function(req, res) {
  
  async function customList() {

    const foundList = await List.findOne({ name: listName });
    foundList.items.push(item);
    foundList.save();

  }

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item ({
    name: itemName
  });
  if (listName === today) {
    item.save();
    res.redirect("/");
  } else {
    customList();
    res.redirect("/" + listName);
  } 
  
 });

app.post("/delete", function(req, res) {
  
  async function deleteItem(){
  
    await Item.findByIdAndRemove(checkedItemId);
  
  };

  async function deleteListItem(){
    
    await List.findOneAndUpdate({ name: listName }, { $pull: {items: {_id: checkedItemId}} });
     
  };

  const listName = req.body.listName;
  const checkedItemId = req.body.checkbox;

  if (listName === "Today") {
    deleteItem();
    res.redirect("/");
  } else {
    deleteListItem();
    res.redirect("/" + listName);
  }

  
  
});


app.get("/:customListName" , function(req, res) {

  async function manageList() {

    const foundList = await List.findOne({ name: customListName });
    if (foundList === null) {
      const list = new List({
        name: customListName,
        items: defaultItems 
        });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, itemList:foundList.items});
    }
    
  }

  const customListName = _.capitalize(req.params.customListName);
  if (customListName === "Favicon.ico") {
    res.redirect("/");  
  } else {
       manageList();
    }
  
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.listen(3000, function(){
  console.log("Server started on port 3000.");
});
