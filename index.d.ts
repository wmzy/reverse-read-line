export type Options = {
  encoding?: BufferEncoding;
  bufferSize?: number;
  separator?: string;
}

export function create(filename: string, options?: Options): {close: () => void; readLine: () => Promise<string | undefined>; readLines: (size) => Promise<string[]>};
export function createStream(filename: string, options?: Options): ReadableStream;
export function readLines(filename: string, size: number, options?: Options): Promise<string[]>;
