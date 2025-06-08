import React from "react";
import { PiggyBank, TrendingUp, Zap, Coffee, AlertCircle, Leaf } from "lucide-react";

interface Recommendation {
    type: 'savings' | 'income' | 'lifestyle' | 'warning';
    title: string;
    description: string;
    potentialSavings?: number;
}

interface GoalRecommendationsProps {
    monthlyIncome: number;
    monthlyExpenses: number;
    topSpendingCategories: Array<{ category: string; amount: number }>;
    goalAmount: number;
    currentSaved: number;
}

export function GoalRecommendations({
    monthlyIncome,
    monthlyExpenses,
    topSpendingCategories,
    goalAmount,
    currentSaved
}: GoalRecommendationsProps) {
    const monthlySavings = monthlyIncome - monthlyExpenses;
    const remainingAmount = goalAmount - currentSaved;
    const monthsWithoutChanges = monthlySavings > 0 ? Math.ceil(remainingAmount / monthlySavings) : Infinity;

    // Calculate potential savings from top categories (save 30% of each)
    const potentialSavings = topSpendingCategories.reduce((sum, cat) => sum + cat.amount * 0.3, 0);
    const monthsWithSavings = monthlySavings + potentialSavings > 0
        ? Math.ceil(remainingAmount / (monthlySavings + potentialSavings))
        : Infinity;

    const recommendations: Recommendation[] = [
        {
            type: 'savings',
            title: 'Ежемесячные сбережения',
            description: `Вы откладываете ${Math.round(monthlySavings)}₽ в месяц при текущих доходах и расходах.`,
        },
        {
            type: 'income',
            title: 'Увеличение доходов',
            description: 'Рассмотрите возможности подработки или инвестирования для увеличения ежемесячного дохода.',
        },
        ...topSpendingCategories.slice(0, 3).map(cat => ({
            type: 'lifestyle' as const,
            title: `Экономия на ${cat.category}`,
            description: `Сократите расходы на ${cat.category} на 30% и сохраните ${Math.round(cat.amount * 0.3)}₽ в месяц.`,
            potentialSavings: cat.amount * 0.3
        })),
        {
            type: 'warning',
            title: 'Срок достижения цели',
            description: monthsWithoutChanges === Infinity
                ? 'При текущих расходах цель не будет достигнута. Необходимо увеличить доходы или сократить расходы.'
                : `При текущих сбережениях цель будет достигнута через ${monthsWithoutChanges} месяцев.`,
        },
        // Добавляем экологические рекомендации
        {
            type: 'savings',
            title: 'Экологичная экономия',
            description: 'Используйте велосипед вместо автомобиля - сэкономите до 5000₽ в месяц на бензине.',
            potentialSavings: 5000
        },
        {
            type: 'lifestyle',
            title: 'Экологичные покупки',
            description: 'Покупайте местные сезонные продукты - дешевле и экологичнее.',
            potentialSavings: 2000
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Рекомендации по достижению цели</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((rec, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                        <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full ${rec.type === 'savings' ? 'bg-blue-100 text-blue-600' :
                                rec.type === 'income' ? 'bg-emerald-100 text-emerald-600' :
                                    rec.type === 'lifestyle' ? 'bg-amber-100 text-amber-600' :
                                        'bg-rose-100 text-rose-600'
                                }`}>
                                {rec.type === 'savings' ? <PiggyBank className="h-5 w-5" /> :
                                    rec.type === 'income' ? <TrendingUp className="h-5 w-5" /> :
                                        rec.type === 'lifestyle' ? <Coffee className="h-5 w-5" /> :
                                            <AlertCircle className="h-5 w-5" />}
                            </div>
                            <div>
                                <h4 className="font-medium text-gray-900">{rec.title}</h4>
                                <p className="text-sm text-gray-600">{rec.description}</p>
                                {rec.potentialSavings && (
                                    <p className="text-xs mt-1 text-emerald-600 font-medium">
                                        Потенциальная экономия: +{Math.round(rec.potentialSavings)}₽/мес
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {monthsWithSavings < monthsWithoutChanges && monthsWithSavings !== Infinity && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center space-x-2 text-blue-800">
                        <Zap className="h-5 w-5" />
                        <p className="font-medium">
                            С небольшими изменениями вы можете достичь цели на {monthsWithoutChanges - monthsWithSavings} месяцев раньше!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}