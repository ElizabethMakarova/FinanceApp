import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Card } from "@/components/ui/card";

interface GoalFormProps {
    initialData?: {
        name: string;
        description?: string;
        targetAmount: number;
        targetDate?: Date;
    };
    onSubmit: (data: {
        name: string;
        description?: string;
        targetAmount: number;
        targetDate?: string;
    }) => void;
    isLoading: boolean;
    error?: string;
}

export function GoalForm({ initialData, onSubmit, isLoading, error }: GoalFormProps) {
    const [name, setName] = React.useState(initialData?.name || "");
    const [description, setDescription] = React.useState(initialData?.description || "");
    const [targetAmount, setTargetAmount] = React.useState(initialData?.targetAmount.toString() || "");
    const [targetDate, setTargetDate] = React.useState<Date | undefined>(initialData?.targetDate);
    const [amountError, setAmountError] = React.useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setAmountError(null);

        const amount = parseFloat(targetAmount);
        if (isNaN(amount) || amount <= 0) {
            setAmountError("Введите корректную сумму");
            return;
        }

        onSubmit({
            name,
            description,
            targetAmount: amount,
            targetDate: targetDate?.toISOString(),
        });
    };

    return (
        <Card className="p-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md">
                        {error}
                    </div>
                )}

                <div>
                    <Label htmlFor="name">Название цели</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="input-premium"
                    />
                </div>

                <div>
                    <Label htmlFor="description">Описание (необязательно)</Label>
                    <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-premium"
                    />
                </div>

                <div>
                    <Label htmlFor="targetAmount">Целевая сумма (₽)</Label>
                    <Input
                        id="targetAmount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        required
                        className="input-premium"
                    />
                    {amountError && (
                        <p className="text-red-500 text-sm mt-1">{amountError}</p>
                    )}
                </div>

                <div>
                    <Label>Целевая дата (необязательно)</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal input-premium"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {targetDate ? (
                                    format(targetDate, "PPP", { locale: ru })
                                ) : (
                                    <span>Выберите дату</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0 bg-white z-50"
                            align="start"
                            sideOffset={5}
                        >
                            <Calendar
                                mode="single"
                                selected={targetDate}
                                onSelect={setTargetDate}
                                initialFocus
                                locale={ru}
                                className="rounded-md border"
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <Button
                    type="submit"
                    className="w-full btn-primary mt-4"
                    disabled={isLoading}
                >
                    {isLoading ? "Сохранение..." : "Сохранить цель"}
                </Button>
            </form>
        </Card>
    );
}