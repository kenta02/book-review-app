/**
 * ルートパラメータ（簡潔版）
 * - Express のルートパラメータは文字列の連想配列として扱われるため、
 *   各インターフェースに index signature を入れて互換性を保ちつつ短く記述しています。
 * - 例: req.params.reviewId は常に string 型として扱えます。
 */

export interface BookParams {
  id: string;
  [key: string]: string; // Express の ParamsDictionary と互換にするための簡潔な表現
}

export interface AuthParams {
  token?: string;
  [key: string]: string | undefined;
}

export interface CommentParams {
  reviewId: string;
  commentId: string;
  [key: string]: string;
}

export interface ReviewParams {
  reviewId: string;
  [key: string]: string;
}

export interface UserParams {
  id: string;
  [key: string]: string;
}
