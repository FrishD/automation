const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost/conversation-builder', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected...'))
  .catch(err => console.log(err));

const flowsRouter = require('./routes/api/flows');

// Use Routes
app.use('/api/flows', flowsRouter);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
