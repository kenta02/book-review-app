import type { ReactNode } from "react";

interface AuthFormLayoutProps {
  /** 画面の見出し（例: "ログイン"） */
  readonly title: string;
  readonly children: ReactNode;
  /** フォームの下に出す案内（例: アカウントをお持ちでない方はこちら） */
  readonly footer?: ReactNode;
}

/**
 * ログイン・新規登録画面で共通の、中央寄せのカードレイアウト。
 * @example
 * <AuthFormLayout title="ログイン" footer={<Link to="/register">新規登録</Link>}>
 *   <form>...</form>
 * </AuthFormLayout>
 */
export function AuthFormLayout({
  title,
  children,
  footer,
}: Readonly<AuthFormLayoutProps>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-gray-900 dark:text-white">
          <span>📚</span>
          <span>BookReview</span>
        </div>
        <h1 className="mb-4 text-center text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        {children}
        {footer && (
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
