import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/dashboard-layout";
import { AuthManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User, Settings, Shield, CreditCard, Bell, Trash2 } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "Имя обязательно"),
  lastName: z.string().min(1, "Фамилия обязательна"),
  email: z.string().email("Неверный формат email"),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, "Минимум 6 символов"),
  newPassword: z.string().min(6, "Минимум 6 символов"),
  confirmPassword: z.string().min(6, "Минимум 6 символов"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const user = AuthManager.getUser();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const { data: profileStats } = useQuery({
    queryKey: ["/api/user/stats"],
    queryFn: async () => {
      const response = await fetch("/api/user/stats", {
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) return null;
      return response.json();
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Ошибка обновления профиля");
      const updatedUser = await response.json();
      AuthManager.setUser(updatedUser);
      return updatedUser;
    },
    onSuccess: () => {
      toast({
        title: "Профиль обновлен",
        description: "Ваши данные успешно сохранены",
      });
      window.location.reload(); // Обновляем страницу для отображения изменений
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      const response = await fetch("/api/user/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...AuthManager.getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Ошибка смены пароля");
      return response.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Пароль изменен",
        description: "Ваш пароль успешно обновлен",
      });
    },
  });

  // Новая мутация для удаления аккаунта
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/user", {
        method: "DELETE",
        headers: AuthManager.getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Ошибка удаления аккаунта");
    },
    onSuccess: () => {
      // Выход из системы
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Перенаправляем на страницу входа
      window.location.href = "/login";
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка удаления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const tabs = [
    { id: "profile", label: "Профиль", icon: User },
    { id: "security", label: "Безопасность", icon: Shield },
    { id: "preferences", label: "Настройки", icon: Settings },
  ];

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl fade-in">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Личный кабинет</h1>
          <p className="text-gray-600 mt-2">Управляйте своим профилем и настройками</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <Card className="premium-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white font-semibold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === tab.id
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                          }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "profile" && (
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-gray-900">Информация профиля</CardTitle>
                  <CardDescription>Обновите ваши личные данные</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Имя</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-premium" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">Фамилия</FormLabel>
                              <FormControl>
                                <Input {...field} className="input-premium" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Email</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" className="input-premium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="btn-primary"
                      >
                        {profileMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
                      </Button>
                    </form>
                  </Form>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Статистика аккаунта</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-2xl font-bold text-gray-900">{profileStats?.totalTransactions || 0}</p>
                        <p className="text-sm text-gray-600">Всего транзакций</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-2xl font-bold text-gray-900">{profileStats?.accountAge || 0}</p>
                        <p className="text-sm text-gray-600">Дней с нами</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-2xl font-bold text-emerald-600">{profileStats?.ecoRating || "A+"}</p>
                        <p className="text-sm text-gray-600">Эко-рейтинг</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-gray-900">Безопасность</CardTitle>
                  <CardDescription>Управляйте паролем и настройками безопасности</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit((data) => passwordMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Текущий пароль</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" className="input-premium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Новый пароль</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" className="input-premium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">Подтвердите пароль</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" className="input-premium" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={passwordMutation.isPending}
                        className="btn-primary"
                      >
                        {passwordMutation.isPending ? "Изменение..." : "Изменить пароль"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card className="premium-card">
                <CardHeader>
                  <CardTitle className="text-gray-900">Настройки</CardTitle>
                  <CardDescription>Персонализируйте ваш опыт использования</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Email уведомления</h4>
                        <p className="text-sm text-gray-600">Получать уведомления о транзакциях</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Включено</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Экологические советы</h4>
                        <p className="text-sm text-gray-600">Получать рекомендации по экологии</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Включено</Badge>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Валюта по умолчанию</h4>
                        <p className="text-sm text-gray-600">Основная валюта для отображения</p>
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">RUB</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-4">
                    <h4 className="font-medium text-rose-600 mb-2">Опасная зона</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Эти действия необратимы. Будьте осторожны.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="btn-danger"
                      onClick={() => {
                        if (confirm("Вы уверены, что хотите удалить аккаунт? Все ваши данные будут безвозвратно удалены.")) {
                          deleteAccountMutation.mutate();
                        }
                      }}
                      disabled={deleteAccountMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {deleteAccountMutation.isPending ? "Удаление..." : "Удалить аккаунт"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}