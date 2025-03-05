const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:5173', // Allow requests from this origin
    credentials: true, // Allow credentials (e.g., cookies)
}));

// Middleware to parse JSON
app.use(express.json());

// Mock database
let files = [];
let users = [];

// Google login endpoint
app.post('/api/auth/google', (req, res) => {
    const { token } = req.body;

    try {
        // Decode the Google token
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const { email, name, picture } = decoded;

        // Check if the user exists in the database
        let user = users.find((user) => user.email === email);
        if (!user) {
            // Create a new user if they don't exist
            user = { id: Date.now(), email, name, picture };
            users.push(user);
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error during Google login:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch files for a user
app.get('/api/files', (req, res) => {
    const { userId } = req.query;
    const userFiles = files.filter((file) => file.userId === parseInt(userId));
    res.status(200).json(userFiles);
});

// Save a file
app.post('/api/files', (req, res) => {
    const { name, content, type, userId } = req.body;
    const newFile = { id: Date.now(), name, content, type, userId };
    files.push(newFile);
    res.status(201).json(newFile);
});

// Delete a file
app.delete('/api/files/:fileId', (req, res) => {
    const { fileId } = req.params;
    files = files.filter((file) => file.id !== parseInt(fileId));
    res.status(200).json({ message: 'File deleted' });
});

// Transpile C code to Rust
app.post('/api/transpile', (req, res) => {
    const { sourceCode, fileName } = req.body;
    // Simulate transpilation (replace with actual logic)
    const rustCode = `// Transpiled Rust code for ${fileName}\n${sourceCode}`;
    res.status(200).json({ success: true, rustCode });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});