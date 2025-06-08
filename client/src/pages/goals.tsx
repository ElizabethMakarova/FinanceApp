import React from "react";
import DashboardLayout from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GoalForm } from "@/components/goal-form";
import { GoalRecommendations } from "@/components/goal-recommendations";
import { formatCurrency } from "@/lib/utils";
import { AuthManager } from "@/lib/auth";
import { z } from "zod";

const goalSchema = z.object({
    name: z.string().min(1, "Название цели обязательно"),
    description: z.string().optional(),
    targetAmount: z.number().min(1, "Целевая сумма должна быть больше 0"),
    targetDate: z.string().optional(),
});

export default function GoalsPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = React.useState(false);
    const [selectedGoal, setSelectedGoal] = React.useState<number | null>(null);
    const [formError, setFormError] = React.useState<string | null>(null);

    const { data: goals = [], isLoading, error } = useQuery({
        queryKey: ["goals"],
        queryFn: async () => {
            try {
                const response = await fetch("/api/goals", {
                    headers: AuthManager.getAuthHeaders(),
                });

                if (!response.ok) {
                    return [];
                }

                return response.json();
            } catch (err) {
                return [];
            }
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            try {
                const response = await fetch("/api/goals", {
                    method: "POST",
                    headers: {
                        ...AuthManager.getAuthHeaders(),
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || "Ошибка сервера");
                }

                return response.json();
            } catch (err) {
                throw new Error("Сетевая ошибка. Попробуйте позже");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["goals"]);
            queryClient.invalidateQueries(["activeGoals"]); // Добавлено
            setIsCreating(false);
            setFormError(null);
        },
        onError: (error: any) => {
            setFormError(error.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            try {
                const response = await fetch(`/api/goals/${id}`, {
                    method: "DELETE",
                    headers: AuthManager.getAuthHeaders(),
                });

                if (!response.ok) {
                    throw new Error("Ошибка удаления");
                }
            } catch (err) {
                throw new Error("Сетевая ошибка. Попробуйте позже");
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["goals"]);
            queryClient.invalidateQueries(["activeGoals"]); // Добавлено
        },
        onError: (error: any) => {
            console.error("Error deleting goal:", error.message);
        }
    });

    const handleCreateGoal = async (data: any) => {
        try {
            const validatedData = goalSchema.parse({
                ...data,
                targetAmount: parseFloat(data.targetAmount),
            });
            await createMutation.mutateAsync(validatedData);
        } catch (validationError) {
            if (validationError instanceof z.ZodError) {
                setFormError(validationError.errors[0].message);
            } else {
                setFormError("Неизвестная ошибка");
            }
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Мои цели</h1>
                    <Button
                        onClick={() => setIsCreating(true)}
                        className="btn-primary"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Новая цель
                    </Button>
                </div>

                {isCreating && (
                    <div className="bg-white p-6 rounded-lg shadow premium-card">
                        <GoalForm
                            onSubmit={handleCreateGoal}
                            isLoading={createMutation.isLoading}
                            error={formError || undefined}
                        />
                        <Button
                            variant="outline"
                            className="mt-4 w-full"
                            onClick={() => {
                                setIsCreating(false);
                                setFormError(null);
                            }}
                            disabled={createMutation.isLoading}
                        >
                            Отмена
                        </Button>
                    </div>
                )}

                {isLoading && (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse premium-card">
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {!isLoading && goals.length === 0 && !isCreating && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 mb-6">У вас пока нет созданных целей</p>
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="btn-primary"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Создать первую цель
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    {goals.map((goal: any) => (
                        <div key={goal.id} className="bg-white p-6 rounded-lg shadow premium-card">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{goal.name}</h3>
                                    {goal.description && (
                                        <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">
                                        {formatCurrency(goal.currentSaved || 0)} / {formatCurrency(goal.targetAmount)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {Math.round(((goal.currentSaved || 0) / goal.targetAmount) * 100)}% выполнено
                                    </p>
                                </div>
                            </div>

                            <div className="w-full bg-gray-200 rounded-full h-2 my-4">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{
                                        width: `${Math.min(
                                            ((goal.currentSaved || 0) / goal.targetAmount) * 100,
                                            100
                                        )}%`,
                                    }}
                                ></div>
                            </div>

                            <div className="flex justify-between items-center">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setSelectedGoal(selectedGoal === goal.id ? null : goal.id)
                                    }
                                >
                                    {selectedGoal === goal.id ? "Скрыть детали" : "Показать детали"}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => deleteMutation.mutate(goal.id)}
                                    disabled={deleteMutation.isLoading}
                                >
                                    Удалить
                                </Button>
                            </div>

                            {selectedGoal === goal.id && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <GoalRecommendations
                                        monthlyIncome={goal.monthlyIncome || 0}
                                        monthlyExpenses={goal.monthlyExpenses || 0}
                                        topSpendingCategories={goal.topSpendingCategories || []}
                                        goalAmount={goal.targetAmount}
                                        currentSaved={goal.currentSaved || 0}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}