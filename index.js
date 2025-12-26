const express = require('express');
const path = require('path');
const pair = require('./pair');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static(path.join(__dirname)));
app.use('/code', pair);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
