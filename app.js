const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const dbPath = path.join(__dirname, "/todoApplication.db");

let db = null;

const initializeDBAndServer = async (request, response) => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
  } catch (e) {
    response.send(e);
    process.exit(1);
  }
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};
initializeDBAndServer();
app.get("/todos/", async (request, response) => {
  const { status, priority, search_q = "" } = request.query;
  let requestQuery = "";
  switch (true) {
    case hasPriorityAndStatus(request.query):
      requestQuery = `
          select * from todo where status like '${status}' and todo like '%${search_q}%' and priority like '${priority}'`;
      break;
    case hasPriority(request.query):
      requestQuery = `select * from todo where priority like '${priority}' and todo like '%${search_q}%'`;
      break;
    case hasStatus(request.query):
      requestQuery = `select * from todo where status like '${status}' and todo like '%${search_q}%'`;
      break;
    default:
      requestQuery = `select * from todo where  todo like '%${search_q}%'`;
  }

  const result = await db.all(requestQuery);
  response.send(result);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo where id=${todoId}`;
  const result = await db.get(query);
  response.send(result);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const query = `insert into todo (id,todo,priority,status)
    values(${id},'${todo}','${priority}','${status}')`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updatedColumn = "";
  switch (true) {
    case requestBody.priority !== undefined:
      updatedColumn = "Priority";
      break;
    case requestBody.status !== undefined:
      updatedColumn = "Status";
      break;
    case requestBody.todo !== undefined:
      updatedColumn = "Todo";
      break;
  }

  const previousTodoQuery = `select * from todo where id=${todoId}`;
  const previousItem = await db.get(previousTodoQuery);
  const {
    priority = previousItem.priority,
    status = previousItem.status,
    todo = previousItem.todo,
  } = request.body;
  const updateQuery = `
    update 
        todo
    set 
        priority='${priority}',
        todo='${todo}',
        status='${status}'
    where 
        id=${todoId}
     `;
  await db.run(updateQuery);
  response.send(`${updatedColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id=${todoId}`;
  await db.run(query);
  response.send("Todo Deleted");
});
module.exports = app;
