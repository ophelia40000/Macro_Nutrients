const express = require('express');
const path = require('path');

const app = express();

// Serve file statis dari folder public
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint utama akan mengembalikan index.html dari folder public
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Web App berjalan di http://localhost:${PORT}`);
});
