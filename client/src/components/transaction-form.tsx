import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthManager } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: "Выберите тип транзакции",
  }),
  amount: z.union([
    z.string().regex(/^\d+(\.\d{1,2})?$/, "Введите корректную сумму"),
    z.number().positive("Сумма должна быть положительной")
  ]).transform(val => typeof val === 'string' ? val : val.toString()),
  category: z.string().min(1, "Выберите категорию"),
  description: z.string().optional(),
  date: z.string().min(1, "Выберите дату"),
  goalId: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Введите название категории"),
  type: z.enum(['income', 'expense']),
  icon: z.string().min(1, "Выберите иконку"),
});

type TransactionFormData = z.infer<typeof transactionSchema>;
type CategoryFormData = z.infer<typeof categorySchema>;

interface TransactionFormProps {
  onSuccess: () => void;
}

const TRANSACTION_CATEGORIES = {
  income: [
    { value: "salary", label: "💼 Зарплата" },
    { value: "freelance", label: "💻 Фриланс" },
    { value: "investment", label: "📈 Инвестиции" },
    { value: "business", label: "🏢 Бизнес" },
    { value: "rental", label: "🏠 Аренда" },
    { value: "other_income", label: "💰 Другое" },
  ],
  expense: [
    { value: "food", label: "🍕 Еда" },
    { value: "transport", label: "🚗 Транспорт" },
    { value: "utilities", label: "🏠 Коммунальные" },
    { value: "entertainment", label: "🎬 Развлечения" },
    { value: "healthcare", label: "🏥 Здоровье" },
    { value: "shopping", label: "🛍️ Покупки" },
    { value: "education", label: "📚 Образование" },
    { value: "other_expense", label: "💸 Другое" },
  ],
};

const CATEGORY_ICONS = [
  "🍕", "🚗", "🏠", "🎬", "🏥", "🛍️", "📚", "💸", "💰", "💳", "✈️", "🍽️", "👕", "📱", "💊", "🎁"
];

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { toast } = useToast();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryDialogOpen, setNewCategoryDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: activeGoals = [],
    isLoading: goalsLoading,
    isError: goalsError,
    refetch: refetchGoals
  } = useQuery({
    queryKey: ["activeGoals"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/goals/active", {
          headers: AuthManager.getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Ошибка сервера: ${response.status}`);
        }

        return response.json();
      } catch (error) {
        console.error("Ошибка при загрузке целей:", error);
        throw new Error("Не удалось загрузить активные цели");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
    retry: 1,
  });

  const transactionForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
      goalId: undefined,
    },
  });

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: "expense",
      icon: "💰",
    },
  });

  const watchedType = transactionForm.watch("type");

  const { data: userCategories = [], refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories", watchedType],
    queryFn: async () => {
      const response = await fetch(`/api/categories?type=${watchedType}`, {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) return [];
      return response.json();
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount),
          date: data.date,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при создании транзакции");
      }

      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      transactionForm.reset({
        type: "expense",
        amount: "",
        category: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        goalId: undefined,
      });
      toast({
        title: "Успешно",
        description: "Транзакция добавлена",
      });
      refetchGoals();
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при создании категории");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Категория добавлена",
      });
      refetchCategories();
      setNewCategoryDialogOpen(false);
      categoryForm.reset();
      queryClient.invalidateQueries(["/api/categories"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: number) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
        headers: AuthManager.getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Ошибка при удалении категории");
      }
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Категория удалена",
      });
      refetchCategories();
      queryClient.invalidateQueries(["/api/categories"]);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const defaultCategories = watchedType === "income" ? TRANSACTION_CATEGORIES.income : TRANSACTION_CATEGORIES.expense;
  const allCategories = [
    ...defaultCategories,
    ...userCategories.map((cat: any) => ({ value: cat.name, label: `${cat.icon} ${cat.name}` }))
  ];

  const onSubmitTransaction = (data: TransactionFormData) => {
    // Преобразование "none" в undefined
    const goalId = data.goalId === "none" ? undefined : data.goalId;

    transactionMutation.mutate({
      ...data,
      goalId,
      amount: parseFloat(data.amount)
    });
  };

  const onSubmitCategory = (data: CategoryFormData) => {
    categoryMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <Form {...transactionForm}>
        <form onSubmit={transactionForm.handleSubmit(onSubmitTransaction)} className="space-y-6">
          <FormField
            control={transactionForm.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">Тип транзакции</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-premium">
                      <SelectValue placeholder="Выберите тип" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="select-content">
                    <SelectItem value="income" className="text-emerald-600 focus:bg-emerald-50">
                      💰 Доход
                    </SelectItem>
                    <SelectItem value="expense" className="text-rose-600 focus:bg-rose-50">
                      💸 Расход
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={transactionForm.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">Сумма (₽)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    placeholder="1000.00"
                    className="input-premium"
                    onChange={(e) => field.onChange(e.target.valueAsNumber || e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={transactionForm.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-slate-700 font-medium">Категория</FormLabel>
                  <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-slate-500 hover:text-slate-700">
                        <Settings className="h-3 w-3 mr-1" />
                        Управление
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="select-content">
                      <DialogHeader>
                        <DialogTitle className="text-slate-800">Управление категориями</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-slate-800">Ваши категории</h3>
                          <Button
                            size="sm"
                            onClick={() => {
                              setCategoryDialogOpen(false);
                              setNewCategoryDialogOpen(true);
                            }}
                            className="premium-button"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Новая категория
                          </Button>
                        </div>
                        <div className="border border-slate-200 rounded-lg">
                          {userCategories.length > 0 ? (
                            <div className="divide-y divide-slate-200">
                              {userCategories.map((category: any) => (
                                <div key={category.id} className="flex items-center justify-between p-3">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-lg">{category.icon}</span>
                                    <span className="text-slate-800">{category.name}</span>
                                    <Badge variant="outline" className="border-slate-300 text-slate-700">
                                      {category.type === 'income' ? 'Доход' : 'Расход'}
                                    </Badge>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-rose-500 hover:text-rose-600"
                                    onClick={() => deleteCategoryMutation.mutate(category.id)}
                                    disabled={deleteCategoryMutation.isPending}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-slate-500 py-8">
                              У вас пока нет своих категорий
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="input-premium">
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="select-content">
                    {allCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={transactionForm.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">Описание</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Дополнительная информация о транзакции"
                    className="input-premium"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={transactionForm.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-700 font-medium">Дата</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="date"
                    className="input-premium"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {watchedType === 'income' && (
            <FormField
              control={transactionForm.control}
              name="goalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-700 font-medium">Связать с целью (необязательно)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={goalsLoading || goalsError}
                  >
                    <FormControl>
                      <SelectTrigger className="input-premium">
                        <SelectValue placeholder="Не связывать с целью" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="select-content">
                      <SelectItem value="none">Не связывать с целью</SelectItem>
                      {goalsLoading && (
                        <SelectItem value="loading" disabled>
                          Загрузка целей...
                        </SelectItem>
                      )}
                      {activeGoals
                        .filter((goal: any) => goal.currentSaved < goal.targetAmount)
                        .map((goal: any) => (
                          <SelectItem key={goal.id} value={goal.id.toString()}>
                            {goal.name} ({Math.round((goal.currentSaved / goal.targetAmount) * 100)}%)
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {goalsError && (
                    <div className="text-xs text-rose-500 mt-1">
                      Не удалось загрузить цели. Попробуйте обновить страницу.
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <Button
            type="submit"
            disabled={transactionMutation.isPending}
            className="w-full premium-button"
          >
            {transactionMutation.isPending ? "Сохранение..." : "Сохранить транзакцию"}
          </Button>
        </form>
      </Form>

      <Dialog open={newCategoryDialogOpen} onOpenChange={setNewCategoryDialogOpen}>
        <DialogContent className="p-6 rounded-lg bg-white">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-slate-800 text-left">Создать новую категорию</DialogTitle>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-6">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Название категории</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Например: Хлеб"
                        className="input-premium"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Тип категории</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="input-premium">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="select-content">
                        <SelectItem value="income">Доход</SelectItem>
                        <SelectItem value="expense">Расход</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={categoryForm.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700">Иконка</FormLabel>
                    <div className="grid grid-cols-8 gap-2">
                      {CATEGORY_ICONS.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => categoryForm.setValue("icon", icon)}
                          className={`w-10 h-10 flex items-center justify-center text-xl rounded-lg transition-colors ${field.value === icon
                            ? 'bg-blue-100 border-2 border-blue-500'
                            : 'bg-slate-100 hover:bg-slate-200'
                            }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setNewCategoryDialogOpen(false)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  disabled={categoryMutation.isPending}
                  className="premium-button"
                >
                  {categoryMutation.isPending ? "Сохранение..." : "Создать категорию"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}