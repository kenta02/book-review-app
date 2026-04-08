import { describe, expect, it, vi, afterEach } from "vitest";

// Ensure we can re-import module with different environment variables
const importLogger = async () => {
  return await import("./logger");
};

describe("logger", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it("dev モードでないとき console を呼ばない", async () => {
    process.env.VITE_DEBUG = "false";
    process.env.NODE_ENV = "production";

    const { logger } = await importLogger();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.log("foo");
    logger.error("bar");
    logger.warn("baz");
    logger.info("qux");

    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("VITE_DEBUG=true のとき console を呼ぶ", async () => {
    process.env.VITE_DEBUG = "true";
    process.env.NODE_ENV = "production";

    const { logger } = await importLogger();

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.log("foo");
    logger.error("bar");
    logger.warn("baz");
    logger.info("qux");

    expect(logSpy).toHaveBeenCalledWith("foo");
    expect(errorSpy).toHaveBeenCalledWith("bar");
    expect(warnSpy).toHaveBeenCalledWith("baz");
    expect(infoSpy).toHaveBeenCalledWith("qux");
  });
});
