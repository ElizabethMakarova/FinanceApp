import {
  users,
  transactions,
  categories,
  ecoMetrics,
  type User,
  type InsertUser,
  type Transaction,
  type InsertTransaction,
  type Category,
  type InsertCategory
} from "@shared/schema";
import { db } from "./db";
import { goals, type Goal, type InsertGoal } from "@shared/schema";
import { eq, and, sql, desc, gt, or, isNull, gte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(userId: number, updateData: Partial<InsertUser>): Promise<User>;
  getUserStats(userId: number): Promise<any>;

  // Transaction methods
  getUserTransactions(userId: number): Promise<Transaction[]>;
  createTransaction(insertTransaction: InsertTransaction & { userId: number }): Promise<Transaction>;
  getTransaction(id: number): Promise<Transaction | undefined>;
  deleteTransaction(id: number): Promise<void>;

  // Category methods
  getUserCategories(userId: number, type?: 'income' | 'expense'): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(insertCategory: InsertCategory & { userId: number }): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Dashboard and analytics
  getDashboardStats(userId: number): Promise<any>;
  getMonthlyReport(userId: number, month: number, year: number): Promise<any>;

  // Goal methods
  getUserGoals(userId: number): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(insertGoal: InsertGoal & { userId: number }): Promise<Goal>;
  updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal>;
  deleteGoal(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Add to DatabaseStorage class
  async getUserGoals(userId: number): Promise<Goal[]> {
    try {
      return await db
        .select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt));
    } catch (error) {
      console.error("Error fetching goals:", error);
      if (error instanceof Error && error.message.includes('отношение "goals" не существует')) {
        // Return empty array if table doesn't exist yet
        return [];
      }
      throw new Error("Не удалось загрузить цели");
    }
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const [goal] = await db.select().from(goals).where(eq(goals.id, id));
    return goal || undefined;
  }

  async createGoal(insertGoal: InsertGoal & { userId: number }): Promise<Goal> {
    try {
      const [goal] = await db
        .insert(goals)
        .values({
          ...insertGoal,
          targetDate: insertGoal.targetDate || null,
        })
        .returning();
      return goal;
    } catch (error) {
      console.error("Error creating goal:", error);
      throw new Error("Не удалось создать цель");
    }
  }

  async updateGoal(id: number, updateData: Partial<InsertGoal>): Promise<Goal> {
    const [updatedGoal] = await db
      .update(goals)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<void> {
    await db.delete(goals).where(eq(goals.id, id));
  }

  async updateGoalProgress(goalId: number, amount: number): Promise<Goal> {
    try {
      const [goal] = await db
        .update(goals)
        .set({
          currentSaved: sql`${goals.currentSaved} + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(goals.id, goalId))
        .returning();
      return goal;
    } catch (error) {
      console.error("Error updating goal progress:", error);
      throw new Error("Не удалось обновить прогресс цели");
    }
  }

  async getActiveGoals(userId: number): Promise<Goal[]> {
    try {
      const today = new Date();
      const todayString = today.toISOString().split('T')[0]; // Получаем дату в формате YYYY-MM-DD

      return await db
        .select()
        .from(goals)
        .where(
          and(
            eq(goals.userId, userId),
            sql`${goals.targetAmount} > ${goals.currentSaved}`,
            or(
              isNull(goals.targetDate),
              sql`${goals.targetDate}::date >= ${todayString}::date` // Сравниваем даты как строки
            )
          )
        )
        .orderBy(desc(goals.createdAt));
    } catch (error) {
      console.error("Error fetching active goals:", error);
      throw new Error("Не удалось загрузить активные цели");
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(insertTransaction: InsertTransaction & { userId: number }): Promise<Transaction> {
    const transactionData = {
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      category: insertTransaction.category,
      description: insertTransaction.description,
      date: insertTransaction.date,
      ecoImpact: insertTransaction.ecoImpact, // Добавляем ecoImpact
    };

    const [transaction] = await db
      .insert(transactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction || undefined;
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getUserCategories(userId: number, type?: 'income' | 'expense'): Promise<Category[]> {
    if (type) {
      return await db
        .select()
        .from(categories)
        .where(and(eq(categories.userId, userId), eq(categories.type, type)));
    }

    return await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId));
  }

  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory & { userId: number }): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }

  async deleteCategory(id: number): Promise<void> {
    await db.delete(categories).where(eq(categories.id, id));
  }

  async updateUser(userId: number, updateData: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getUserStats(userId: number): Promise<any> {
    const userTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));

    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    const user = userRecord[0];
    const accountAge = user ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    const totalCo2 = userTransactions
      .reduce((sum, t) => sum + (parseFloat(t.ecoImpact || '0')), 0);

    let ecoRating = 'N/A';
    if (totalCo2 < 50) ecoRating = 'A+';
    else if (totalCo2 < 100) ecoRating = 'A';
    else if (totalCo2 < 200) ecoRating = 'B+';
    else if (totalCo2 < 300) ecoRating = 'B';
    else if (totalCo2 < 500) ecoRating = 'C+';
    else ecoRating = 'C';

    return {
      totalTransactions: userTransactions.length,
      accountAge,
      ecoRating,
    };
  }

  async getDashboardStats(userId: number): Promise<any> {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const monthlyTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`EXTRACT(MONTH FROM ${transactions.date}) = ${currentMonth}`,
          sql`EXTRACT(YEAR FROM ${transactions.date}) = ${currentYear}`
        )
      );

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalCo2 = monthlyTransactions
      .reduce((sum, t) => sum + (parseFloat(t.ecoImpact || '0')), 0);

    let ecoRating = 'N/A';
    if (totalCo2 < 50) ecoRating = 'A+';
    else if (totalCo2 < 100) ecoRating = 'A';
    else if (totalCo2 < 200) ecoRating = 'B+';
    else if (totalCo2 < 300) ecoRating = 'B';
    else if (totalCo2 < 500) ecoRating = 'C+';
    else ecoRating = 'C';

    return {
      totalBalance: income - expenses,
      monthlyIncome: income,
      monthlyExpenses: expenses,
      ecoRating,
      co2Reduction: Math.max(0, Math.round((500 - totalCo2) / 500 * 100)),
      totalTransactions: monthlyTransactions.length
    };
  }

  async getMonthlyReport(userId: number, month: number, year: number): Promise<any> {
    const monthlyTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          sql`EXTRACT(MONTH FROM ${transactions.date}) = ${month}`,
          sql`EXTRACT(YEAR FROM ${transactions.date}) = ${year}`
        )
      );

    const income = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expensesByCategory = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + parseFloat(t.amount);
        return acc;
      }, {} as Record<string, number>);

    const topCategories = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: Math.round((amount / expenses) * 100)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);

    const totalCo2 = monthlyTransactions
      .reduce((sum, t) => sum + (parseFloat(t.ecoImpact || '0')), 0);

    let ecoRating = 'N/A';
    if (totalCo2 < 50) ecoRating = 'A+';
    else if (totalCo2 < 100) ecoRating = 'A';
    else if (totalCo2 < 200) ecoRating = 'B+';
    else if (totalCo2 < 300) ecoRating = 'B';
    else if (totalCo2 < 500) ecoRating = 'C+';
    else ecoRating = 'C';

    const ecoRecommendations = [
      'Выбирайте местные продукты для снижения углеродного следа',
      'Используйте общественный транспорт или велосипед',
      'Покупайте товары с экомаркировкой',
      'Сократите потребление мяса на 1-2 дня в неделю',
      'Выбирайте цифровые чеки вместо бумажных'
    ];

    return {
      month,
      year,
      totalIncome: income,
      totalExpenses: expenses,
      topCategories,
      ecoMetrics: {
        totalCo2,
        rating: ecoRating,
        recommendations: ecoRecommendations
      }
    };
  }
}

export const storage = new DatabaseStorage();