import { CacheClient, defaultCacheClient } from "@actions/cache";
import * as core from "@actions/core";

export function clientOverride(): CacheClient {
    return {
        ...defaultCacheClient(),
        reserveCache: async(key, string, paths) => {
            core.info(JSON.stringify({ updated: "updated", key, string, paths }));
            return {
                statusCode: 200,
                result: { cacheId: 2},
                headers: {}
            }
        },
        saveCache: async (cacheId, archivePath, options) => {
            core.info(JSON.stringify({ updated: "updated", cacheId, archivePath, options }));
        }
    };
}
