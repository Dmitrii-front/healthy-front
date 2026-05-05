import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../model/schema";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Icon } from "@/shared/ui/Icon";
import { getLastSignInEmail } from "@/features/auth";
import { AuthLayout, AuthInput, AuthButton } from "@/widgets/auth-layout";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onTouched",
    defaultValues: { email: getLastSignInEmail() },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    await new Promise((r) => setTimeout(r, 200));
    setSentEmail(email);
  });

  if (sentEmail !== null) {
    return (
      <AuthLayout
        title="Проверьте почту"
        subtitle={`Мы отправили ссылку на ${sentEmail}, она действительна 30 минут`}
      >
        <div
          className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl text-teal-brand"
          style={{
            background: "color-mix(in oklab, var(--color-teal-brand) 12%, transparent)",
          }}
        >
          <Icon name="mail" size={26} stroke={1.8} />
        </div>
        <AuthButton onClick={() => void navigate({ to: "/sign-in", viewTransition: true })}>
          Вернуться ко входу
        </AuthButton>
        <button
          type="button"
          onClick={() => setSentEmail(null)}
          className="mt-1 self-center bg-transparent text-[14px] text-auth-muted"
        >
          Использовать другой email
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Восстановление пароля" subtitle="Пришлём ссылку для восстановления">
      <form onSubmit={onSubmit} className="flex flex-col gap-[18px]" noValidate>
        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="email" className="text-[13px] font-medium text-auth-ink-2">
            Email
          </FieldLabel>
          <AuthInput
            id="email"
            type="email"
            icon="mail"
            autoComplete="email"
            placeholder="you@email.com"
            invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p
              id="email-error"
              role="alert"
              className="inline-flex items-center gap-1.5 text-[13px] text-brick-coral"
            >
              <Icon name="alert-circle" size={14} stroke={1.8} className="shrink-0" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="mt-1">
          <AuthButton type="submit" disabled={isSubmitting}>
            Отправить ссылку
          </AuthButton>
        </div>

        <button
          type="button"
          onClick={() => void navigate({ to: "/sign-in", viewTransition: true })}
          className="self-center px-2 py-2 text-[15px] font-medium text-auth-ink underline decoration-1 underline-offset-[3px]"
        >
          Вернуться ко входу
        </button>
      </form>
    </AuthLayout>
  );
}
