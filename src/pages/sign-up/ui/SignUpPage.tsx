import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { signUpSchema, type SignUpValues } from "../model/schema";
import { FieldLabel } from "@/shared/ui/FieldLabel";
import { Icon } from "@/shared/ui/Icon";
import { useSignUp } from "@/features/auth";
import { ApiError } from "@/shared/api/client";
import { AuthLayout, AuthInput, AuthButton } from "@/widgets/auth-layout";

export function SignUpPage() {
  const navigate = useNavigate();
  const signUp = useSignUp();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "", agree: false },
  });

  const agree = watch("agree");

  const dismissRootError = () => {
    if (errors.root) clearErrors("root");
  };

  const onSubmit = handleSubmit(async ({ email, password }) => {
    try {
      await signUp.mutateAsync({ email, password });
      await navigate({ to: "/" });
    } catch (error) {
      let message: string;
      if (error instanceof ApiError && error.status >= 500) {
        message = "На нашей стороне сбой. Попробуйте через минуту.";
      } else if (error instanceof TypeError) {
        message = "Нет связи. Проверьте интернет.";
      } else {
        message =
          "Не удалось создать аккаунт. Проверьте данные или войдите, если уже регистрировались.";
      }
      setError("root", { message });
    }
  });

  return (
    <AuthLayout
      title="Создайте аккаунт"
      subtitle="Запишитесь к врачу за минуту"
      footer={
        <>
          <p className="text-center text-[14px] text-auth-muted">Уже есть аккаунт?</p>
          <AuthButton
            variant="secondary"
            type="button"
            onClick={() => void navigate({ to: "/sign-in", viewTransition: true })}
          >
            Войти
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
              className="inline-flex items-center gap-1.5 text-[13px] text-brick-teal"
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
            autoComplete="new-password"
            placeholder="••••••••"
            invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password", { onChange: dismissRootError })}
          />
          {errors.password ? (
            <p
              id="password-error"
              role="alert"
              className="inline-flex items-center gap-1.5 text-[13px] text-brick-teal"
            >
              <Icon name="alert-circle" size={14} stroke={1.8} className="shrink-0" />
              {errors.password.message}
            </p>
          ) : (
            <p className="text-[12px] text-auth-muted">
              Минимум 8 символов, заглавная буква и цифра
            </p>
          )}
        </div>

        <label className="-my-2 flex cursor-pointer items-start gap-3 py-2 text-[13px] leading-[1.45] text-auth-ink-2">
          <input
            type="checkbox"
            className="mt-0.5 h-[22px] w-[22px] shrink-0 cursor-pointer rounded-[6px] accent-clinic-teal"
            {...register("agree")}
          />
          <span>
            Я принимаю{" "}
            <a href="#" className="text-auth-ink underline underline-offset-2">
              Условия использования
            </a>{" "}
            и{" "}
            <a href="#" className="text-auth-ink underline underline-offset-2">
              Политику конфиденциальности
            </a>
            , включая согласие на обработку персональных данных.
          </span>
        </label>
        {errors.agree && (
          <p role="alert" className="-mt-3 text-[12.5px] text-brick-teal">
            {errors.agree.message}
          </p>
        )}

        {errors.root && (
          <p
            id="form-error"
            role="alert"
            className="-mt-1 inline-flex items-center gap-1.5 text-[13px] text-brick-teal"
          >
            <Icon name="alert-circle" size={14} stroke={1.8} className="shrink-0" />
            {errors.root.message}
          </p>
        )}

        <div className="mt-2 lg:mt-1">
          <AuthButton type="submit" disabled={!agree || isSubmitting}>
            {isSubmitting ? "Создаём…" : "Зарегистрироваться"}
          </AuthButton>
        </div>

        {/* Desktop alt-action — inline link replaces the mobile pill in `footer`. */}
        <p className="mt-1 hidden text-center text-[14px] text-auth-muted lg:block">
          Уже есть аккаунт?{" "}
          <Link
            to="/sign-in"
            viewTransition
            className="font-semibold text-auth-ink underline underline-offset-[3px]"
          >
            Войти
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
