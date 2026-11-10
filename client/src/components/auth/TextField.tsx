import type { ChangeEvent } from "react";

interface TextFieldProps {
  /** input の id（label との紐づけとテストで使う） */
  readonly id: string;
  /** 項目名（label に表示） */
  readonly label: string;
  /** input の type */
  readonly type?: "text" | "email" | "password";
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** エラーメッセージ。あれば入力欄の下に表示する */
  readonly error?: string | undefined;
  /** ブラウザの自動入力ヒント（例: "email", "current-password"） */
  readonly autoComplete?: string;
}

/**
 * ラベルとエラー表示つきの入力欄。ログイン・登録フォームで共通に使う。
 * エラー時は aria-invalid と aria-describedby で、支援技術にも伝える。
 * @example
 * <TextField id="email" label="メールアドレス" type="email"
 *   value={email} onChange={setEmail} error={errors.email} />
 */
export function TextField({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  autoComplete,
}: Readonly<TextFieldProps>) {
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
