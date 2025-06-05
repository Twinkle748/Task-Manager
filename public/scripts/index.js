import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
const app = express();
const port = 3000;
const db = new pg.Client({
  user : "postgres",
  host: "localhost",
  database: "permalist",
  password: "123456",
  port: 5432
});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
db.connect();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let items = [];

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items ORDER BY created_at DESC");
    const today = new Date().toISOString().split("T")[0];
const dueDate = items.due_date ? items.due_date.toISOString().split("T")[0] : null;
    items = result.rows.map(item => {
      const dueDate = item.due_date ? item.due_date.toISOString().split("T")[0] : null;
      let dueStatus = "";

      if (dueDate) {
        if (dueDate === today) {
          dueStatus = "Due Today";
        } else if (dueDate < today) {
          dueStatus = "Overdue";
        } else {
          dueStatus = "Upcoming";
        }
      }

      return {
        ...item,
        dueStatus: dueStatus
      };
    });

    res.render("index.ejs", {
      listTitle: "To-do List",
      listItems: items
    });
  } catch (err) {
    console.log(err);
  }
});


app.post("/add",async (req, res) => {
  // const item = req.body.newItem;
  // items.push({ title: item });
  // res.redirect("/");
   try {
    const { newItem, dueDate } = req.body;
    await db.query(
      "INSERT INTO items (title, due_date) VALUES ($1, $2)",
      [newItem, dueDate || null]
    );
  res.redirect("/");} 
  catch(err){
    console.log(err);
  }
});

app.post("/edit", (req, res) => {
  // try{
  //   const edit  = db.query("UPDATE items SET title = ($1) WHERE id = $2", [req.body.updatedItemTitle, req.body.updatedItemId]);
  //   res.redirect("/");
  // }
  // catch (err) {
  //   console.log(err);
  // }
  try{
    const edit = db.query("UPDATE  ITEMS SET TITLE = ($1) WHERE ID = $2",[req.body.updatedItemTitle,req.body.updatedItemId]);
    res.redirect("/");
  } catch (err){
    console.log(err);
  }
});

app.post("/delete", (req, res) => {
 try{const del = db.query("DELETE FROM ITEMS WHERE ID = $1",[req.body.deleteItemId]);
 res.redirect("/");} catch(err){
  console.log(err);
 }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
