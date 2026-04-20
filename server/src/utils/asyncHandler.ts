import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncControllerHandler<TReq extends Request = Request> = (
  req: TReq,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

/**
 * 非同期 controller ハンドラーの例外を `next` へ委譲する高階関数です。
 *
 * 各 controller で重複する `try/catch` を削減し、例外処理を
 * `apiErrorHandler` へ一元化する目的で利用します。
 *
 * @param handler - 非同期 controller 本体
 * @returns Express で利用できるハンドラー
 */
export function asyncHandler<TReq extends Request = Request>(
  handler: AsyncControllerHandler<TReq>
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): Promise<unknown> =>
    handler(req as TReq, res, next).catch(next);
}
