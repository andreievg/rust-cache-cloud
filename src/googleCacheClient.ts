import { CacheClient, defaultCacheClient } from "@actions/cache";
import * as core from "@actions/core";
import fs from 'fs';
import { drive_v3, google } from "googleapis";

async function getFileSize(driveFiles: drive_v3.Resource$Files, fileId: string): Promise<number> {
    const queryResult = await driveFiles.get({ fileId, fields: 'size' }, {});

    return Number.parseInt(queryResult.data.size || '0');
}

async function downloadFile(driveFiles: drive_v3.Resource$Files, fileId: string) {
    const fileSize = await getFileSize(driveFiles, fileId);
    const inverval = fileSize / 10
    let previousInterval = 0;
    let receivedData = 0;

    let res = await driveFiles.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    await new Promise((resolve, reject) => {
        const downloadedFilePath = getTempFileName()
        const downloadedFileStream = fs.createWriteStream(downloadedFilePath);

        res.data
            .on('end', () => {
                receivedData = fileSize;
                resolve(downloadedFilePath);
            })
            .on('error', err => {
                console.error('Error downloading file.');
                reject(err);
            })
            .on('data', ({ length }) => {
                receivedData += length;
                if (receivedData - previousInterval > inverval) {
                    core.info(`filesize: ${fileSize} downloaded ${receivedData}`)
                    previousInterval = receivedData;
                }
            })
            .pipe(downloadedFileStream);
    });

}

export function googleCacheClientProvider(): CacheClient | null {
    const keys = core.getInput('google_drive_keys');
    const folder_id = core.getInput('google_drive_folder_id');
    if (!keys) return null;

    // Hide keys (in case printed)
    const secret = Buffer.from(keys, 'base64').toString('utf8');
    // Hide secret  (in case printed)
    core.setSecret(secret);

    return {
        getCacheEntry: async (_key, _paths, _options) => {
            serviceProvider(secret, (drive) => {


                downloadFile(drive, folder_id);



            })
            return {
                cacheKey: "abc",
                archiveLocation: "location",
            }
        },
        downloadCache: async (archiveLocation, archivePath, options?) => {
            core.notice('downloadCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "downloadCache", archiveLocation, archivePath, options }));

        },
        reserveCache: async (key, string, paths) => {
            core.notice('reserveCache')
            core.info(JSON.stringify({ from: "reserveCache", key, string, paths }));
            return {
                statusCode: 200,
                result: { cacheId: 2 },
                headers: {}
            }
        },
        saveCache: async (cacheId, archivePath, options) => {
            core.notice('saveCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "saveCache", cacheId, archivePath, options }));
        }
    }
}

function getTempFileName() {
    return require('path').join(require('os').tmpdir(), require('uuid').v4())
}

async function serviceProvider(secret: string, operation: (_: drive_v3.Resource$Files) => void) {
    const keyFile = getTempFileName();
    await fs.promises.writeFile(keyFile, secret, 'utf-8')

    try {
        operation(google.drive({
            version: 'v3', auth: new google.auth.GoogleAuth({
                keyFile,
                scopes: ['https://www.googleapis.com/auth/drive'],
            })
        }).files)
        await fs.promises.unlink(keyFile)
    } catch (e: any) {
        core.error(e.toString())
        // Remove file on error
        await fs.promises.unlink(keyFile)
    }
}

export function clientOverride(): CacheClient {
    return {
        ...defaultCacheClient(),
        getCacheEntry: async (key, paths, options) => {
            core.notice('getCacheEntry')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "getCacheEntry", key, paths, options }));
            return {
                cacheKey: "abc",
                archiveLocation: "location",
            }
        },
        downloadCache: async (archiveLocation, archivePath, options?) => {
            core.notice('downloadCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "downloadCache", archiveLocation, archivePath, options }));

        },
        reserveCache: async (key, string, paths) => {
            core.notice('reserveCache')
            core.info(JSON.stringify({ from: "reserveCache", key, string, paths }));
            return {
                statusCode: 200,
                result: { cacheId: 2 },
                headers: {}
            }
        },
        saveCache: async (cacheId, archivePath, options) => {
            core.notice('saveCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "saveCache", cacheId, archivePath, options }));
        }
    };
}
