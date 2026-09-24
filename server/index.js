import express from 'express';
import authRouter from './auth.js';
import loansRouter from './loans.js';

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, bypass-tunnel-reminder');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
app.use('/auth', authRouter);
app.use('/loans', loansRouter);

app.listen(4000, () => console.log('API rodando em http://localhost:4000'));
