// server.js
const express = require('express');
const mongoose = require('mongoose');
const natural = require('natural');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatbot', { useNewUrlParser: true, useUnifiedTopology: true });

// Define schema and model for storing questions and answers
const queryResponseSchema = new mongoose.Schema({
  question: String,
  response: String
});
const QueryResponse = mongoose.model('QueryResponse', queryResponseSchema);

// Initialize the classifier
const classifier = new natural.BayesClassifier();

// Middleware to parse JSON requests
app.use(express.json());

// Route to handle chat requests
app.post('/chat', async (req, res) => {
  const userQuestion = req.body.question;

  // Check if the question is in the database
  const queryResponse = await QueryResponse.findOne({ question: userQuestion });
  if (queryResponse) {
    return res.json({ response: queryResponse.response });
  }

  // If not, classify the question using the classifier
  const response = classifier.classify(userQuestion);
  res.json({ response });
});

// Route to train the classifier with new data
app.post('/train', async (req, res) => {
  const { question, response } = req.body;

  // Save the question and response to the database
  const newQueryResponse = new QueryResponse({ question, response });
  await newQueryResponse.save();

  // Train the classifier with the new data
  classifier.addDocument(question, response);
  classifier.train();

  res.json({ message: 'Training successful!' });
});


app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  const queryResponses = await QueryResponse.find();
  console.log('queryResponses ', queryResponses)
  queryResponses.forEach(qr => {
    console.log("question ", qr)
    classifier.addDocument(qr.question, qr.response);
  });
  classifier.train();
  console.log("Training Successful !!")
});
