import express from 'express';
import { authenticatedUser } from './auth.js';
import { pool } from './db.js';

const router = express.Router();

router.post('/', async (req, res) => {
    const user = await authenticatedUser(req, res);
    if (!user) return; // authenticatedUser já respondeu o erro

    const action = req.query.action;
    const body = req.body;
    // listar os empréstimos do usuário
    if (action === 'loans') {

        const [loans] = await pool.query(
            `SELECT id, person_name, person_phone, amount, description, due_date, late_interest_rate, created_at
            FROM loans WHERE user_id = ? ORDER BY created_at DESC`,
            [user.id]
        );

        for (const loan of loans) {
            const [payments] = await pool.query(
                'SELECT id, amount, payment_date FROM loan_payments WHERE loan_id = ? ORDER BY payment_date ASC',
                [loan.id]
            );
            loan.payments = payments.map(p => ({ id: p.id, amount: Number(p.amount), date: p.payment_date }));

        };

        return res.json({
            loans: loans.map(l => ({
                id: l.id,
                personName: l.person_name,
                personPhone: l.person_phone,
                amount: Number(l.amount),
                description: l.description,
                dueDate: l.due_date,
                lateInterestRate: l.late_interest_rate === null ? null : Number(l.late_interest_rate),
                createdAt: l.created_at,
                payments: l.payments
            }))
        });
    };
    //Criar um empréstimo novo
    if (action === 'create-loan') {
        const { id, personName, personPhone, amount, description, dueDate, lateInterestRate } = body;
        const validId = /^[a-f0-9-]{20,}$/i.test(id || '');
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(dueDate || '');
        if (!validId || !personName || !(amount > 0) || !validDate) {
            return res.status(422).json({ message: 'Dados do empréstimo inválidos.' });
        }

        await pool.query(
            `INSERT INTO loans (id, user_id, person_name, person_phone, amount, description, due_date, late_interest_rate, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [id, user.id, personName, personPhone || '', amount, description || '', dueDate, lateInterestRate ?? null]
        );

        return res.status(201).json({ success: true });

    };

    //Registrar pagamento
    if (action === 'create-payment') {
        const { id, loanId, amount } = body;
        const validId = /^[a-f0-9-]{20,}$/i.test(id || '');
        const validLoanId = /^[a-f0-9-]{20,}$/i.test(loanId || '');
        if (!validId || !validLoanId || !(amount > 0)) {
            return res.status(422).json({ message: 'Dados do pagamento inválidos.' });
        }
        const [owned] = await pool.query('SELECT id FROM loans WHERE id = ? AND user_id = ?', [loanId, user.id]);
        if (!owned[0]) return res.status(404).json({ message: 'Empréstimo não encontrado.' });

        await pool.query(
            'INSERT INTO loan_payments (id, loan_id, amount, payment_date) VALUES( ?, ?, ?, NOW())',
            [id, loanId, amount]
        );
        return res.status(201).json({ success: true });

    }
    //Apagar um empréstimo
    if (action === 'delete-loan') {
        const { loanId } = body;
        if (!/^[a-f0-9-]{20,}$/i.test(loanId || '')) {
            return res.status(422).json({ message: 'Empréstimo inválido.' });
        }
        const [result] = await pool.query('DELETE FROM loans WHERE id = ? AND user_id = ?', [loanId, user.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Empréstimo não encontrado.' });
        return res.json({ success: true });
    }

    res.status(400).json({ message: 'Ação inválida.' });



});




export default router;
