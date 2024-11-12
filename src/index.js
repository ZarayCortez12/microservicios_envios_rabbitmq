import app from './app.js';
import { connectDB } from './db.js';
import { consumeMessages } from './controllers/envio.controller.js';

connectDB();
app.listen(3020);

console.log('Server started on port 3020');

consumeMessages();