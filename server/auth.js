import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import express from 'express';
import { pool } from './db.js';

const router = express.Router();

async function hashPassword(password) {
    return bcrypt.hash(password, 10);
}

async function verifyPassword(password, stored) {
    return bcrypt.compare(password, stored);
}

async function issueToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(
        'INSERT INTO auth_tokens (user_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))',
        [userId, tokenHash]
    );
    return token;
}

// verifica o token no header Authorization
export async function authenticatedUser(req, res) {
    const header = req.headers.authorization || '';
    const match = header.match(/Bearer\s+(\S+)/i);
    if (!match) { res.status(401).json({ message: 'Não autenticado.' }); return null; }
    const tokenHash = crypto.createHash('sha256').update(match[1]).digest('hex');
    const [rows] = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = ? AND t.expires_at > NOW()`,
        [tokenHash]
    );
    if (!rows[0]) { res.status(401).json({ message: 'Sessão expirada.' }); return null; }
    return rows[0];
}

router.post('/', async (req, res) => {
    const action = req.query.action;
    const body = req.body;


    if (action === 'register') {
        const name = (body.name || '').trim();
        const email = (body.email || '').toLowerCase().trim();
        const phone = (body.phone || '').trim();
        const password = (body.password || '');

        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!name || !validEmail || password.length < 6) {
            return res.status(422).json({ message: 'Informe nome, e-mail válido e senha com 6 caracteres ou mais.' });
        }


        let userId;
        try {
            const [result] = await pool.query(
                'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
                [name, email, phone, await hashPassword(password)]
            );
            userId = result.insertId;
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
            }
            throw error;
        }

        const token = await issueToken(userId);
        return res.status(201).json({ user: { name, email, phone }, token });

    };

    if (action === 'login' || action === 'demo') {
        const email = action === 'demo' ? 'demo@empresta.app' : (body.email || '').toLowerCase().trim();
        const password = action === 'demo' ? '123456' : (body.password || '');

        if (action === 'demo') {
            const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
                    ['Usuário demonstração', email, '(81)99999-9999', await hashPassword(password)]
                );
            }
        }

        const [rows] = await pool.query(
            'SELECT id, name, email, phone, password_hash FROM users WHERE email = ? LIMIT 1', [email]
        );

        const user = rows[0];
        if (!user || !(await verifyPassword(password, user.password_hash))) {
            return res.status(401).json({ message: 'E-mail ou senha inválidos.' });
        }

        const token = await issueToken(user.id);
        return res.json({ user: { name: user.name, email: user.email, phone: user.phone }, token });

    }

    if (action === 'logout') {
        const header = req.headers.authorization || '';
        const match = header.match(/Bearer\s+(\S+)/i);
        if (match) {
            const tokenHash = crypto.createHash('sha256').update(match[1]).digest('hex');
            await pool.query('DELETE FROM auth_tokens WHERE token_hash = ?', [tokenHash]);
        }

        return res.json({ success: true });
    }

    if (action === 'update') {
        const user = await authenticatedUser(req, res);
        if (!user) return;

        const name = (body.name || '').trim();
        const email = (body.email || '').toLowerCase().trim();
        const phone = (body.phone || '').trim();
        const password = (body.password || '');

        const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!name || !validEmail) {
            return res.status(422).json({ message: 'Informe nome e e-mail válido.' });
        }

        if (password && password.length < 6) {
            return res.status(422).json({ message: 'Senha deve ter 6 caracteres ou mais.' });
        }

        try {
            if (password) {
                await pool.query(
                    'UPDATE users SET name = ?, email = ?, phone = ?, password_hash = ? WHERE id = ?',
                    [name, email, phone, await hashPassword(password), user.id]
                );
            } else {
                await pool.query(
                    'UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?',
                    [name, email, phone, user.id]
                );
            }
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Este e-mail já está cadastrado.' });
            }
            throw error;
        }

        return res.json({ user: { name, email, phone } });



    }




    res.status(400).json({ message: 'Ação inválida.' });
});

export default router;
