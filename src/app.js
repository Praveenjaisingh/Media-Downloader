const express = require('express');
const cors = require('cors');
const path = require("path");

const dashboardRoute = require('./Routes/dashboardRoute');
const errorHandler = require("./Middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"../public")));
// app.use('/files', express.static(path.join(__dirname, '../src/downloads')));
app.use('/files', express.static('/tmp/downloads'));
app.use('/api', dashboardRoute);
app.get('/', (req,res)=>{
    res.sendFile(path.join(__dirname,"../public/index.html"));
});
app.use(errorHandler);

module.exports = app;