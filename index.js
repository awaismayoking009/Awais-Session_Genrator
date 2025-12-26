const express = require('express');
const path = require('path');
const pair = require('./pair');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(__dirname));
app.use('/code', pair);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pair.html'));
});

app.listen(PORT, () => {
    console.log(`Server Online on ${PORT}`);
});
