const currentAppVersion = import.meta.env.VITE_APP_VERSION ?? "dev";
const appVersionStorageKey = "kelime-tostu:app-version";
const updateReloadStorageKey = "kelime-tostu:update-reload-version";

type VersionFile = {
  version?: unknown;
};

function getVersionUrl() {
  const versionUrl = new URL(`${import.meta.env.BASE_URL}version.json`, window.location.origin);
  versionUrl.searchParams.set("t", Date.now().toString());
  return versionUrl.toString();
}

function reloadWithCacheBust(nextVersion: string) {
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("v", nextVersion);
  window.location.replace(nextUrl);
}

export async function checkForAppUpdate(): Promise<void> {
  if (currentAppVersion === "dev") {
    return;
  }

  try {
    const response = await fetch(getVersionUrl(), { cache: "no-store" });
    if (!response.ok) return;

    const data = (await response.json()) as VersionFile;
    const latestVersion = typeof data.version === "string" ? data.version : "";
    if (!latestVersion) return;

    if (latestVersion !== currentAppVersion) {
      if (sessionStorage.getItem(updateReloadStorageKey) === latestVersion) return;
      sessionStorage.setItem(updateReloadStorageKey, latestVersion);
      reloadWithCacheBust(latestVersion);
      return;
    }

    localStorage.setItem(appVersionStorageKey, latestVersion);
    sessionStorage.removeItem(updateReloadStorageKey);
  } catch {
    // Update checks must never block the game.
  }
}
