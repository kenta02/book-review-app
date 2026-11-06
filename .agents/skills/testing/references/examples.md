# Testing - 実装例

## ユニットテスト（Vitest）

```typescript
// src/utils/__tests__/calculateScore.test.ts
import { describe, it, expect } from "vitest";
import { calculateAverageScore } from "../calculateScore";

describe("calculateAverageScore", () => {
  it("should calculate average of valid scores", () => {
    expect(calculateAverageScore([1, 2, 3, 4, 5])).toBe(3);
  });

  it("should throw error for empty array", () => {
    expect(() => calculateAverageScore([])).toThrow("Empty array");
  });
});
```

## React コンポーネントテスト（React Testing Library）

```typescript
// src/components/__tests__/BookCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookCard } from '../BookCard';

describe('BookCard', () => {
  it('should render book title', () => {
    const book = { id: '1', title: 'React Guide', author: 'John' };
    render(<BookCard book={book} />);
    expect(screen.getByText('React Guide')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const onSelect = vi.fn();
    const book = { id: '1', title: 'React Guide', author: 'John' };
    render(<BookCard book={book} onSelect={onSelect} />);

    await userEvent.click(screen.getByText('詳細'));
    expect(onSelect).toHaveBeenCalledWith('1');
  });
});
```

## API テスト（Vitest + axios のモック）

```typescript
// src/api/__tests__/bookApi.test.ts
import axios from "axios";
import { describe, expect, it, vi } from "vitest";
import { bookApi } from "../bookApi";

vi.mock("axios");

describe("bookApi", () => {
  it("should fetch books", async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: { data: [{ id: "1", title: "React" }] },
    });

    const result = await bookApi.getBooks();
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("React");
  });
});
```

## E2E テスト シナリオ

```typescript
// e2e/review.spec.ts
import { test, expect } from "@playwright/test";

test("should create and view a book review", async ({ page }) => {
  // ログイン
  await page.goto("/login");
  await page.fill('[name="email"]', "user@example.com");
  await page.fill('[name="password"]', "password");
  await page.click('button[type="submit"]');

  // 書籍詳細ページへ移動
  await page.goto("/books/1");

  // レビュー投稿
  await page.click('button:has-text("レビューを書く")');
  await page.fill('textarea[name="text"]', "Great book!");
  await page.click('button[type="submit"]');

  // 投稿確認
  await expect(page.locator("text=Great book!")).toBeVisible();
});
```
