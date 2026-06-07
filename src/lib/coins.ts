import crypto from 'crypto';
import { withTransaction } from './db';

export async function awardCoins(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
) {
  const txId = crypto.randomUUID();
  await withTransaction(async (execute) => {
    await execute(
      `UPDATE profiles SET coin_balance = coin_balance + ?,
       total_coins_earned = total_coins_earned + ? WHERE user_id = ?`,
      [amount, amount, userId],
    );
    await execute(
      `INSERT INTO coin_transactions (id, user_id, type, amount, direction, reference_id, description)
       VALUES (?, ?, ?, ?, 'CREDIT', ?, ?)`,
      [txId, userId, type, amount, referenceId ?? null, description],
    );
  });
}

export async function getCoinBalance(userId: string): Promise<number> {
  const [{ coin_balance }] = await withTransaction(async (execute) => {
    return execute<{ coin_balance: number }>(
      'SELECT coin_balance FROM profiles WHERE user_id = ?',
      [userId],
    );
  });
  return coin_balance ?? 0;
}

export async function deductCoins(
  userId: string,
  amount: number,
  type: string,
  description: string,
  referenceId?: string,
) {
  const txId = crypto.randomUUID();
  await withTransaction(async (execute) => {
    const result = await execute<any>(
      'UPDATE profiles SET coin_balance = coin_balance - ? WHERE user_id = ? AND coin_balance >= ?',
      [amount, userId, amount],
    );
    if ((result as any).affectedRows === 0) throw new Error('Insufficient coins');
    await execute(
      `INSERT INTO coin_transactions (id, user_id, type, amount, direction, reference_id, description)
       VALUES (?, ?, ?, ?, 'DEBIT', ?, ?)`,
      [txId, userId, type, amount, referenceId ?? null, description],
    );
  });
}
