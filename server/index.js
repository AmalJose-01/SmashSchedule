const express = require('express');
require("dotenv").config()
const connectToDatabase = require("./connectioDB");
const routes = require("./routes/index");
const cors = require(`cors`)


const app = express();
var whitelist = ['http://localhost:5173', 'http://localhost:5174']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}
 


const PORT = process.env.PORT || 3000;

// Connect to the database
connectToDatabase();


// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());
// app.use(cors(corsOptions))
app.use("/api/v1", routes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

