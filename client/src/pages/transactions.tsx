import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/dashboard-layout";
import { AuthManager } from "@/lib/auth";
import { TrendingUp, TrendingDown, Calendar, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import TransactionForm from "@/components/transaction-form";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns"; // Добавлен импорт format
import { ru } from "date-fns/locale"; // Добавлен импорт ru локали

export default function Transactions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const response = await fetch("/api/transactions", {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((transaction: any) => ({
        ...transaction,
        date: transaction.date ? new Date(transaction.date) : new Date()
      }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status !== 204) {
          const errorText = await response.text();
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.message || "Ошибка при удалении транзакции");
          } catch {
            throw new Error(errorText || "Ошибка при удалении транзакции");
          }
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["transactions"]);
      setDeleteDialogOpen(false);
      toast({
        title: "Успешно",
        description: "Транзакция удалена",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const formatAmount = (amount: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(parseFloat(amount));
  };

  // Удалена функция formatDate, вместо нее используется format из date-fns

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: "🍕",
      transport: "🚗",
      utilities: "🏠",
      entertainment: "🎬",
      healthcare: "🏥",
      shopping: "🛍️",
      education: "📚",
      salary: "💼",
      freelance: "💻",
      investment: "📈",
      business: "🏢",
      rental: "🏠",
      other_income: "💰",
      other_expense: "💸",
    };
    return icons[category] || "💰";
  };

  const handleTransactionSuccess = () => {
    setIsDialogOpen(false);
    queryClient.invalidateQueries(["transactions"]);
  };

  const handleDeleteClick = (id: number) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (transactionToDelete !== null) {
      deleteMutation.mutate(transactionToDelete);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto max-w-6xl fade-in">
          <div className="text-center py-8">Загрузка...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-6xl fade-in">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Транзакции</h1>
            <p className="text-slate-600 mt-2">История всех ваших операций</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="premium-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Добавить транзакцию
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {transactions.length === 0 ? (
            <Card className="premium-card">
              <CardContent className="p-8 text-center">
                <p className="text-slate-500 mb-4">У вас пока нет транзакций</p>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="premium-button"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить первую транзакцию
                </Button>
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction: any) => (
              <Card key={transaction.id} className="premium-card hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl flex items-center justify-center text-2xl">
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 capitalize">
                          {transaction.category.replace('_', ' ')}
                        </h3>
                        {transaction.description && (
                          <p className="text-sm text-slate-600">{transaction.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-500">
                            {/* Использование единого формата даты */}
                            {format(transaction.date, 'dd MMM yyyy', { locale: ru })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <p className={`text-lg font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                        </p>
                        {transaction.ecoImpact && parseFloat(transaction.ecoImpact) > 0 && (
                          <p className="text-xs text-slate-500">
                            {parseFloat(transaction.ecoImpact).toFixed(1)} кг CO₂
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant={transaction.type === 'income' ? 'default' : 'secondary'}
                          className={`${transaction.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                        >
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {transaction.type === 'income' ? 'Доход' : 'Расход'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-600"
                          onClick={() => handleDeleteClick(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-slate-800">Добавить транзакцию</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <TransactionForm onSuccess={handleTransactionSuccess} />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Транзакция будет удалена безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={confirmDelete}
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}