import express from 'express';
import authRouter from './auth.js';
import loansRouter from './loans.js';

const app = express();
app.use(express.json());
app.use('/auth', authRouter);
app.use('/loans', loansRouter);

app.listen(4000, () => console.log('API rodando em http://localhost:4000'));
