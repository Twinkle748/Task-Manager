import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const app = express();
const port = 3000;

// PostgreSQL Setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "permalist",
  password: "123456",
  port: 5432,
});
db.connect();

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware and View Engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items");
    const total = result.rows.length;
    const completed = result.rows.filter(item => item.status === "completed").length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    res.render("homepage", {
      title: "My Project",
      footerText: "© 2025 Your Company",
      progress: progress
    });
  } catch (err) {
    console.error(err);
    res.render("homepage", {
      title: "My Project",
      footerText: "© 2025 Your Company",
      progress: 0
    });
  }
});


// Completed tasks (stub)
// app.get("/status", async (req, res) => {
//   try {
//     const result = await db.query("SELECT * FROM items WHERE completed = true ORDER BY created_at DESC");
//     res.render("completed", {
//       title: "Completed Tasks",
//       listItems: result.rows,
//     });
//   } catch (err) {
//     console.log(err);
//   }
// });

app.get("/tasks", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items WHERE status != 'completed' ORDER BY created_at DESC");

    const today = new Date().toISOString().split("T")[0];

    const items = result.rows.map(item => {
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

    const totalTasks = result.rowCount;
    const completedResult = await db.query("SELECT COUNT(*) FROM items WHERE status = 'completed'" );
    const completedTasks = parseInt(completedResult.rows[0].count);
    const progress = totalTasks + completedTasks === 0 ? 0 : Math.round((completedTasks / (totalTasks + completedTasks)) * 100);

    res.render("index.ejs", {
      listTitle: "To-do List",
      listItems: items,
      progress: progress
    });
  } catch (err) {
    console.error(err);
  }
});
app.get("/complete", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items WHERE status = 'completed' order by created_at DESC");

    res.render("completed.ejs", {
      listTitle: "Completed Tasks",
      listItems: result.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching completed tasks.");
  }
});


// Add a task
app.post("/add", async (req, res) => {
  const { newItem, dueDate } = req.body;
  try {
    await db.query(
      "INSERT INTO items (title, due_date) VALUES ($1, $2)",
      [newItem, dueDate || null]
    );
    res.redirect("/tasks");
  } catch (err) {
    console.log(err);
  }
});

// Edit a task
app.post("/edit", async (req, res) => {
  try {
    await db.query("UPDATE items SET title = $1 WHERE id = $2", [
      req.body.updatedItemTitle,
      req.body.updatedItemId,
    ]);
    res.redirect("/tasks");
  } catch (err) {
    console.log(err);
  }
});

// Delete a task
app.post("/complete", async (req, res) => {
  try {
    await db.query(
  "UPDATE items SET status='completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1",
  [req.body.completeItemId]
);

    res.redirect("/tasks");
  } catch (err) {
    console.log(err);
  }
});

// Start the server
app.listen(port, () => {
  console.log(`✅ App running at http://localhost:${port}`);
});
