const express = require('express');
const app = express();
const loginRoutes = require('./routes/loginSystem');


app.use('/routes/loginSystem', loginRoutes);

app.listen(3000, () => {
  console.log("started on port 3000");
});