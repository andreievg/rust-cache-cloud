import { CacheClient } from "@actions/cache";
import * as core from "@actions/core";
import fs from 'fs';
import { drive_v3, google } from "googleapis";

async function getFileSize(driveFiles: drive_v3.Resource$Files, fileId: string): Promise<number> {
    const params: drive_v3.Params$Resource$Files$Get = { fileId, fields: 'size' };
    const queryResult = await driveFiles.get(params);

    return Number.parseInt(queryResult.data.size || '0');
}

async function downloadFile(driveFiles: drive_v3.Resource$Files, filePath: string, fileId: string) {
    const fileSize = await getFileSize(driveFiles, fileId);
    const inverval = fileSize / 10
    let previousInterval = 0;
    let receivedData = 0;

    let response = await driveFiles.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    await new Promise((resolve, reject) => {
        const downloadedFileStream = fs.createWriteStream(filePath);
  
        response.data
            .on('end', () => {
                receivedData = fileSize;
                resolve(true);
            })
            .on('error', error => {
                reject(error)
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

type UploadFileOptions = {
    filePath: string,
    folderId: string,
    fileName: string
}

async function uploadFile(driveFiles: drive_v3.Resource$Files, { filePath, folderId, fileName }: UploadFileOptions) {
    const params: drive_v3.Params$Resource$Files$Create = {
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          body: fs.createReadStream(filePath),
        },
        fields: 'id',
      };

  const { data: { id } } = await driveFiles.create(params);

  core.notice(`File uploaded https://drive.google.com/file/d/${id}/view?usp=sharing`)
}

function try_getInputs(inputNames: string[]): string[] {
        const values = inputNames.map(inputName => core.getInput(inputName));
        const valueExists = (e: string) => !!e;
        const missingValueIndices = values.reduce((a, e, i) => !valueExists(e) ? [...a, i] : a, [] as number[] );

        if (missingValueIndices.length === 0) return values;

        if (missingValueIndices.length == inputNames.length) return [];

        const suppliedValueIndices = values.reduce((a, e, i) => valueExists(e) ? [...a, i] : a, [] as number[]  );
        const getNamesForIndices = (indices: number[]) =>  indices.map((i) => inputNames[i]).join(',')
        throw new Error(`Missing inputs, supplied ( ${getNamesForIndices(suppliedValueIndices)} ) missing ( ${getNamesForIndices(missingValueIndices)}  )`);
}

export function googleCacheClientProvider(): CacheClient | null {
    const [keys, folderId] = try_getInputs(['google_drive_keys', 'google_drive_folder_id']);
    if (!keys) return null;

    const secret = Buffer.from(keys, 'base64').toString('utf8');
    // Hide secret  (in case printed)
    core.setSecret(secret);

    return {
        getCacheEntry: async (_key, _paths, _options) => {
            serviceProvider(secret, async (drive) => {
                const filePath = getTempFileName();
                await downloadFile(drive, filePath, '1wLqpysN0ebTwhNut_ixVDPokLYN-_k5M');
                await uploadFile(drive,{filePath, folderId, fileName: 'checkit.zip'} )
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
        reserveCache: async (_key, _paths, _options) => {
            return {
                statusCode: 200,
                // Cache id is not used, and not reserving cache in this implementation
                result: { cacheId: 0 },
                headers: {}
            }
        },
        saveCache: async (cacheId, archivePath, options) => {
           await core.notice('saveCache')
            core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
            core.notice('http://google.com');
            core.info(JSON.stringify({ from: "saveCache", cacheId, archivePath, options }));
        }
    }
}

function getTempFileName() {
    return require('path').join(require('os').tmpdir(), require('uuid').v4())
}

async function serviceProvider(secret: string, operation: (_: drive_v3.Resource$Files) => Promise<void>) {
    const keyFile = getTempFileName();
    await fs.promises.writeFile(keyFile, secret, 'utf-8')

    try {
        await operation(google.drive({
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

// export function clientOverride(): CacheClient {
//     return {
//         ...defaultCacheClient(),
//         getCacheEntry: async (key, paths, options) => {
//             core.notice('getCacheEntry')
//             core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
//             core.notice('http://google.com');
//             core.info(JSON.stringify({ from: "getCacheEntry", key, paths, options }));
//             return {
//                 cacheKey: "abc",
//                 archiveLocation: "location",
//             }
//         },
//         downloadCache: async (archiveLocation, archivePath, options?) => {
//             core.notice('downloadCache')
//             core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
//             core.notice('http://google.com');
//             core.info(JSON.stringify({ from: "downloadCache", archiveLocation, archivePath, options }));

//         },
//         reserveCache: async (key, string, paths) => {
//             core.notice('reserveCache')
//             core.info(JSON.stringify({ from: "reserveCache", key, string, paths }));
//             return {
//                 statusCode: 200,
//                 result: { cacheId: 2 },
//                 headers: {}
//             }
//         },
//         saveCache: async (cacheId, archivePath, options) => {
//             core.notice('saveCache')
//             core.notice('\u001b[31;46mRed foreground with a cyan background and \u001b[1mbold text at the end');
//             core.notice('http://google.com');
//             core.info(JSON.stringify({ from: "saveCache", cacheId, archivePath, options }));
//         }
//     };
// }
