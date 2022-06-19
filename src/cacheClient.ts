import { CacheClient, defaultCacheClient } from "@actions/cache";
import * as core from "@actions/core";

export function clientOverride(): CacheClient {
    return {
        ...defaultCacheClient(),
        getCacheEntry: async(key, paths, options) => {
            core.notice('getCacheEntry')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "getCacheEntry",key, paths, options }));
            return {
                cacheKey: "abc",
                archiveLocation: "location",
            }
        },
        downloadCache: async(archiveLocation, archivePath, options?) => {
            core.notice('downloadCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "downloadCache", archiveLocation,archivePath, options }));
      
        },
        reserveCache: async(key, string, paths) => {
            core.notice('reserveCache')
            core.info(JSON.stringify({ from: "reserveCache", key, string, paths }));
            return {
                statusCode: 200,
                result: { cacheId: 2},
                headers: {}
            }
        },
        saveCache: async (cacheId, archivePath, options) => {
            core.notice('saveCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({from: "saveCache", cacheId, archivePath, options }));
        }
    };
}
