export default function isRespondWhenCalled() {
  const env = process.env;
  const respondOnlyWhenCalled =
    env.RESPOND_ONLY_WHEN_CALLED === "true" ||
    env.RESPOND_ONLY_WHEN_CALLED === "on" ||
    env.RESPOND_ONLY_WHEN_CALLED === "1";

  return respondOnlyWhenCalled;
}
