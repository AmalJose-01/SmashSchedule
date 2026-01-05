const express = require('express');
require("dotenv").config()
const connectToDatabase = require("./connectioDB");
const routes = require("./routes/index");
const cors = require(`cors`);
const errorHandler = require('./middleware/errorHandler');
const stripeWebhook = require("./routes/stripeWebhook")
const path = require("path");


const app = express();
var whitelist = ['http://localhost:5173', 'http://localhost:5174', 'https://smash-schedule.vercel.app', 'http://localhost:5175']

var corsOptions = {
  origin: function (origin, callback) {
    // Allow Stripe Webhooks + Postman + Server-to-Server requests
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  }
};
 


const PORT = process.env.PORT || 3000;





app.use(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);


// Connect to the database
connectToDatabase();


app.use(cors(corsOptions))
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// Middleware to parse JSON requests
app.use(express.json());



app.use("/api/v1", routes);
app.use(errorHandler)



app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

