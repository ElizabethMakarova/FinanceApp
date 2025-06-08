import React from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EcoImpactCard from "@/components/eco-impact-card";
import { Link } from "wouter";
import {
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
  Wallet,
  BarChart3,
  Leaf,
  Target
} from "lucide-react"; // Убрал импорт Calendar
import { AuthManager } from "@/lib/auth";
import { Transaction } from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  const { data: recentTransactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions", {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const transactions = await response.json();
      return transactions.slice(0, 5);
    },
  });

  React.useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries(["/api/dashboard/stats"]);
      queryClient.invalidateQueries(["/api/transactions"]);
    }, 10000);

    return () => clearInterval(interval);
  }, [queryClient]);

  const getCategoryLabel = (category: string) => {
    const categories = {
      'salary': 'Зарплата',
      'freelance': 'Фриланс',
      'business': 'Бизнес',
      'investment': 'Инвестиции',
      'food': 'Еда',
      'transport': 'Транспорт',
      'utilities': 'Коммунальные',
      'shopping': 'Покупки',
      'entertainment': 'Развлечения',
      'healthcare': 'Здоровье',
      'education': 'Образование',
      'other': 'Другое'
    };
    return categories[category as keyof typeof categories] || category;
  };

  if (statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="premium-card">
                <CardContent className="p-6">
                  <div className="loading-shimmer h-4 rounded w-3/4 mb-2"></div>
                  <div className="loading-shimmer h-8 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 fade-in">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Общий баланс</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats ? formatCurrency(stats.totalBalance || 0) : '₽0'}
                  </p>
                </div>
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Wallet className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Доходы за месяц</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats ? formatCurrency(stats.monthlyIncome || 0) : '₽0'}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Расходы за месяц</p>
                  <p className="text-2xl font-bold text-rose-600">
                    {stats ? formatCurrency(stats.monthlyExpenses || 0) : '₽0'}
                  </p>
                </div>
                <div className="p-3 bg-rose-100 rounded-lg">
                  <TrendingDown className="h-6 w-6 text-rose-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="stat-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Транзакций</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.totalTransactions || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Overview */}
          <div className="lg:col-span-2">
            <Card className="premium-card">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center justify-between">
                  Обзор финансов
                  <Link href="/reports">
                    <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                      Подробные отчеты
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Текущий баланс</h3>
                    <span className="text-sm font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      {stats?.monthlyIncome && stats?.monthlyExpenses
                        ? `${stats.monthlyIncome > stats.monthlyExpenses ? '+' : ''}${((stats.monthlyIncome - stats.monthlyExpenses) / (stats.monthlyExpenses || 1) * 100).toFixed(1)}% за месяц`
                        : 'Нет данных'
                      }
                    </span>
                  </div>
                  <div className="text-4xl font-bold mb-4 text-gray-900">
                    {stats ? formatCurrency(stats.totalBalance || 0) : '₽0'}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-gray-800 to-gray-600 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: stats?.monthlyIncome
                          ? `${Math.min((stats.monthlyIncome / (stats.monthlyIncome + (stats.monthlyExpenses || 0))) * 100, 100)}%`
                          : '0%'
                      }}
                    ></div>
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <Link href="/transactions">
                      <Button className="w-full btn-primary">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Добавить доход
                      </Button>
                    </Link>
                    <Link href="/transactions">
                      <Button className="w-full btn-danger">
                        <MinusCircle className="mr-2 h-4 w-4" />
                        Добавить расход
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Eco Impact */}
          <div className="lg:col-span-1">
            <EcoImpactCard
              ecoRating={stats?.ecoRating || 'N/A'}
              co2Reduction={stats?.co2Reduction || 0}
            />
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center justify-between">
              Последние транзакции
              <Link href="/transactions">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                  Все транзакции
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {transactionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="loading-shimmer w-10 h-10 rounded-full"></div>
                    <div className="flex-1">
                      <div className="loading-shimmer h-4 rounded w-3/4 mb-2"></div>
                      <div className="loading-shimmer h-3 rounded w-1/2"></div>
                    </div>
                    <div className="loading-shimmer h-6 rounded w-20"></div>
                  </div>
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Leaf className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Пока нет транзакций</p>
                <Link href="/transactions">
                  <Button className="btn-primary">
                    Добавить первую транзакцию
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((transaction: Transaction) => (
                  <div
                    key={transaction.id}
                    className="transaction-item flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.type === 'income'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'bg-rose-100 text-rose-600'
                        }`}>
                        {transaction.type === 'income' ?
                          <TrendingUp className="h-5 w-5" /> :
                          <TrendingDown className="h-5 w-5" />
                        }
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {transaction.description || getCategoryLabel(transaction.category)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getCategoryLabel(transaction.category)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(parseFloat(transaction.amount))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals Section */}
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-gray-900 flex items-center justify-between">
              Ваши цели
              <Link href="/goals">
                <Button variant="outline" size="sm" className="border-gray-200 text-gray-600 hover:bg-gray-50">
                  Управление целями
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Управляйте своими финансовыми целями</p>
              <Link href="/goals">
                <Button className="btn-primary">
                  Перейти к целям
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}