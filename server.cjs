const express = require('express');
const app = express();
const port = 3001;

// Middleware to parse JSON
app.use(express.json());

// Google login endpoint
app.post('/api/auth/google', (req, res) => {
    const { token } = req.body;

    // Decode the Google token
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const { email, name, picture } = decoded;

    // Simulate database operations
    const user = { id: 1, email, name, picture };

    res.status(200).json(user);
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});