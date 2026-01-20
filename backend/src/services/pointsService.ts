import pool from '../db/index.js';

export interface PointsTransaction {
  id: number;
  user_id: number;
  type: 'earned' | 'spent';
  amount: number;
  description: string;
  reference_id: number | null;
  reference_type: string | null;
  created_at: Date;
}

export async function awardVisitPoints(userId: number): Promise<{ awarded: boolean; points: number }> {
  const result = await pool.query(
    `SELECT last_visit_date FROM user_points WHERE user_id = $1`,
    [userId]
  );

  const lastVisit = result.rows[0]?.last_visit_date;
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (lastVisit && new Date(lastVisit) > twentyFourHoursAgo) {
    return { awarded: false, points: 0 };
  }

  await pool.query(
    `UPDATE user_points
     SET current_balance = current_balance + 1,
         total_accumulated = total_accumulated + 1,
         last_visit_date = $1
     WHERE user_id = $2`,
    [now, userId]
  );

  await pool.query(
    `INSERT INTO points_transactions (user_id, type, amount, description, reference_type)
     VALUES ($1, 'earned', 1, 'Daily site visit', 'visit')`,
    [userId]
  );

  return { awarded: true, points: 1 };
}

export async function getUserPoints(userId: number): Promise<{
  current: number;
  total: number;
}> {
  const result = await pool.query(
    `SELECT current_balance, total_accumulated FROM user_points WHERE user_id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    await pool.query(
      `INSERT INTO user_points (user_id, current_balance, total_accumulated)
       VALUES ($1, 0, 0)`,
      [userId]
    );
    return { current: 0, total: 0 };
  }

  return {
    current: result.rows[0].current_balance,
    total: result.rows[0].total_accumulated,
  };
}

export async function getPointsTransactions(
  userId: number,
  limit: number = 50
): Promise<PointsTransaction[]> {
  const result = await pool.query(
    `SELECT id, user_id, type, amount, description, reference_id, reference_type, created_at
     FROM points_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows;
}



