import sgMail from '@sendgrid/mail';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static instance: EmailService;
  private isConfigured = false;

  constructor() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.isConfigured = true;
    } else {
      console.warn('SendGrid API key not found. Emails will be logged to console.');
    }
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendPasswordResetEmail(to: string, resetToken: string, frontendUrl: string): Promise<boolean> {
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    if (!this.isConfigured) {
      console.log(`Password reset link for ${to}: ${resetLink}`);
      return true;
    }

    const msg = {
      to,
      from: 'noreply@ecofinance.app',
      subject: 'Восстановление пароля - EcoFinance',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">🌱 EcoFinance</h1>
          </div>
          
          <h2 style="color: #374151; margin-bottom: 20px;">Восстановление пароля</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Вы запросили восстановление пароля для вашего аккаунта EcoFinance.
            Нажмите на кнопку ниже, чтобы создать новый пароль:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background: linear-gradient(135deg, #22c55e 0%, #16a085 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Восстановить пароль
            </a>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
          </p>
          
          <p style="color: #3b82f6; word-break: break-all; margin-bottom: 30px;">
            ${resetLink}
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #9ca3af; font-size: 14px; line-height: 1.6;">
            Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
            Ссылка действительна в течение 1 часа.
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px;">
              © 2024 EcoFinance. Все права защищены.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Ошибка отправки email:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
    if (!this.isConfigured) {
      console.log(`Welcome email would be sent to: ${to}`);
      return true;
    }

    const msg = {
      to,
      from: 'noreply@ecofinance.app',
      subject: 'Добро пожаловать в EcoFinance! 🌱',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin: 0;">🌱 EcoFinance</h1>
          </div>
          
          <h2 style="color: #374151; margin-bottom: 20px;">Добро пожаловать, ${firstName}!</h2>
          
          <p style="color: #6b7280; line-height: 1.6; margin-bottom: 20px;">
            Спасибо за регистрацию в EcoFinance! Теперь вы можете управлять своими финансами 
            и отслеживать экологическое воздействие ваших трат.
          </p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #22c55e; margin-top: 0;">Что вы можете делать:</h3>
            <ul style="color: #374151; line-height: 1.8;">
              <li>📊 Отслеживать доходы и расходы</li>
              <li>🌿 Мониторить экологический след</li>
              <li>📈 Получать ежемесячные отчеты</li>
              <li>🎯 Создавать собственные категории</li>
              <li>💡 Получать эко-рекомендации</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
              style="background: linear-gradient(135deg, #22c55e 0%, #16a085 100%); 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Начать работу
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #9ca3af; font-size: 12px;">
              © 2024 EcoFinance. Все права защищены.
            </p>
          </div>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      return true;
    } catch (error) {
      console.error('Ошибка отправки приветственного email:', error);
      return false;
    }
  }
}

export const emailService = EmailService.getInstance();