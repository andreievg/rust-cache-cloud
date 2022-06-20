import { CacheClient, defaultCacheClient } from "@actions/cache";
import { googleCacheClientProvider } from "./googleCacheClient";

export type CacheClientProvider = 
    () => CacheClient | null


const cacheClientProviders: CacheClientProvider[]= [
   googleCacheClientProvider,
    // Must be last for default match
 () => defaultCacheClient()
]

export function cacheClientSelector(): CacheClient {
    for (const clientProvider of cacheClientProviders) {
        const client =  clientProvider();
        if (client) return client
    }
    // This shouldn't happen, but to keep TS return type consisten
   return defaultCacheClient()
}