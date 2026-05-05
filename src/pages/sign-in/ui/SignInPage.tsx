import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { signInSchema, type SignInValues } from "../model/schema";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Icon } from "@/shared/ui/Icon";
import { useSignIn, getLastSignInEmail, rememberSignInEmail } from "@/features/auth";
import { ApiError } from "@/shared/api/client";
import { AuthLayout, AuthInput, AuthButton } from "@/widgets/auth-layout";

export function SignInPage() {
  const navigate = useNavigate();
  const signIn = useSignIn();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    mode: "onTouched",
    defaultValues: { email: getLastSignInEmail(), password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signIn.mutateAsync({ email, password });
      rememberSignInEmail(email);
      await navigate({ to: "/" });
    } catch (error) {
      let message: string;
      if (error instanceof ApiError) {
        if (error.status === 401) message = "Неверный email или пароль.";
        else if (error.status >= 500) message = "На нашей стороне сбой. Попробуйте через минуту.";
        else message = "Не удалось войти. Попробуйте ещё раз.";
      } else if (error instanceof TypeError) {
        message = "Нет связи. Проверьте интернет.";
      } else {
        message = "Не удалось войти. Попробуйте ещё раз.";
      }
      setError("root", { message });
    }
  });

  const dismissRootError = () => {
    if (errors.root) clearErrors("root");
  };

  return (
    <AuthLayout
      title="Войдите в Healthy"
      subtitle="Запишитесь к врачу за минуту"
      footer={
        <>
          <p className="text-center text-[14px] text-auth-muted">Впервые здесь?</p>
          <AuthButton
            variant="secondary"
            type="button"
            onClick={() => void navigate({ to: "/sign-up", viewTransition: true })}
          >
            Создать аккаунт
          </AuthButton>
        </>
      }
    >
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-[18px]"
        noValidate
        aria-describedby={errors.root ? "form-error" : undefined}
      >
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
            {...register("email", { onChange: dismissRootError })}
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

        <div className="flex flex-col gap-2">
          <FieldLabel htmlFor="password" className="text-[13px] font-medium text-auth-ink-2">
            Пароль
          </FieldLabel>
          <AuthInput
            id="password"
            type="password"
            icon="lock"
            revealable
            autoComplete="current-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", { onChange: dismissRootError })}
          />
          {errors.password && (
            <p
              id="password-error"
              role="alert"
              className="inline-flex items-center gap-1.5 text-[13px] text-brick-coral"
            >
              <Icon name="alert-circle" size={14} stroke={1.8} className="shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="-mt-1.5 flex justify-end">
          <Link
            to="/forgot-password"
            viewTransition
            className="-mr-2 -my-2 px-2 py-2 text-[14px] text-auth-ink underline decoration-1 underline-offset-[3px] hover:decoration-auth-ink"
          >
            Забыли пароль?
          </Link>
        </div>

        {errors.root && (
          <p
            id="form-error"
            role="alert"
            className="-mt-1 inline-flex items-center gap-1.5 text-[13px] text-brick-coral"
          >
            <Icon name="alert-circle" size={14} stroke={1.8} className="shrink-0" />
            {errors.root.message}
          </p>
        )}

        <div className="mt-3 lg:mt-1">
          <AuthButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Входим…" : "Войти"}
          </AuthButton>
        </div>

        {/* Desktop alt-action — inline link replaces the mobile pill in `footer`. */}
        <p className="mt-1 hidden text-center text-[14px] text-auth-muted lg:block">
          Впервые здесь?{" "}
          <Link
            to="/sign-up"
            viewTransition
            className="font-semibold text-auth-ink underline underline-offset-[3px]"
          >
            Создать аккаунт
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
