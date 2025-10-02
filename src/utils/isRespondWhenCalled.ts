export default function isRespondWhenCalled() {
  const env = (process.env.RESPOND_ONLY_WHEN_CALLED ?? "").trim().toLowerCase();
  const respondOnlyWhenCalled = env === "true" || env === "on" || env === "1";

  return respondOnlyWhenCalled;
}
