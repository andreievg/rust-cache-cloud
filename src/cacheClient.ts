import { CacheClient, defaultCacheClient } from "@actions/cache";
import * as core from "@actions/core";

export function clientOverride(): CacheClient {
    return {
        ...defaultCacheClient(),
        saveCache: async (cacheId: number, archivePath: string, options) => {
            core.info(JSON.stringify({ updated: "updated", cacheId, archivePath, options }));
        }
    };
}
