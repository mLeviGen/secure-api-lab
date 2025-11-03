const express = require('express');
const app = express();
const PORT = 3000;

const { users, documents, employees } = require('./data');

app.use(express.json());

const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  console.log(`[${timestamp}] ${method} ${url}`);
  next();
};

app.use(loggingMiddleware);

const authMiddleware = (req, res, next) => {
  const login = req.headers['x-login'];
  const password = req.headers['x-password'];

  const user = users.find(u => u.login === login && u.password === password);
  if (!user) {
    return res
      .status(401)
      .json({ message: 'Authentication failed. Please provide valid credentials in headers X-Login and X-Password.' });
  }

  req.user = user;
  next();
};

const adminOnlyMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

app.get('/documents', authMiddleware, (req, res) => {
  res.status(200).json(documents);
});

app.post('/documents', authMiddleware, (req, res) => {
  const newDocument = req.body || {};
  if (!newDocument.title || !newDocument.content) {
    return res.status(400).json({ message: 'title and content are required' });
  }
  newDocument.id = Date.now();
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
