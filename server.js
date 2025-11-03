const express = require('express');
const app = express();
const PORT = 3000;

const { users, documents, employees } = require('./data');

app.use(express.json());

const loggingMiddleware = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.url}`);
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
  const { title, content } = req.body || {};
  if (!title || !content) {
    return res
      .status(400)
      .json({ message: 'Bad Request. Fields "title" and "content" are required.' });
  }
  const newDocument = { id: Date.now(), title, content };
  documents.push(newDocument);
  res.status(201).json(newDocument);
});

app.delete('/documents/:id', authMiddleware, (req, res) => {
  const documentId = Number.parseInt(req.params.id, 10);
  const idx = documents.findIndex(d => d.id === documentId);
  if (idx === -1) {
    return res.status(404).json({ message: 'Document not found' });
  }
  documents.splice(idx, 1);
  res.status(204).send();
});

app.get('/employees', authMiddleware, adminOnlyMiddleware, (req, res) => {
  res.status(200).json(employees);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
