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
            core.notice('Check')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ updated: "updated", cacheId, archivePath, options }));
        }
    };
}
