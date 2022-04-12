const { promisify } = require("util");
const fs = require("fs");
const {Readable} = require("stream");

const open = promisify(fs.open);
const close = promisify(fs.close);
const fstat = promisify(fs.fstat);
const read = promisify(fs.read);

export function create(
  filename,
  { encoding = "utf8", bufferSize = 4096, separator } = {}
) {
  let fd, size, offset, buffer, leftover, hasEnd, lines = [];
  const sep = separator || /\r?\n/;

  function splitLine(str) {
    return str.split(sep);
  }

  let splitBuffer;

  if (separator) {
    const separatorBuffer = Buffer.from(separator, encoding);
    splitBuffer = (buf) => {
      const l = buf.indexOf(separatorBuffer);
      if (l < 0) return [];
      return [l, l + separator.length];
    };
  } else {
    const [bufCR, bufLF] = Buffer.from("\r\n", encoding);
    splitBuffer = function defaultSplitBuffer(buf) {
      const l = buf.indexOf(bufLF, 1);
      if (l < 0) return [];

      const r = l + 1;
      if (buf[l - 1] === bufCR) return [l - 1, r];
      return [l, r];
    };
  }

  function openAndReadStat() {
    if (fd !== undefined) return Promise.resolve();
    return open(filename, "r")
      .then((_fd) => (fd = _fd))
      .then(fstat)
      .then((stats) => {
        size = stats.size;
        bufferSize = Math.min(size, bufferSize);
        offset = size - bufferSize;
        buffer = Buffer.alloc(bufferSize);
        leftover = Buffer.alloc(0);
        lines = [];
      });
  }

  function readTrunk() {
    return openAndReadStat()
      .then(() => read(fd, buffer, 0, bufferSize, offset))
      .then(({ bytesRead, buffer }) => {
        const buf = Buffer.concat([buffer.slice(0, bytesRead), leftover]);
        if (offset === 0) {
          hasEnd = true;
          const str = buf.toString(encoding);
          lines = splitLine(str).concat(lines);
          return;
        }
        if (offset < bufferSize) {
          bufferSize = offset;
          offset = 0;
        } else {
          offset -= bufferSize;
        }
        const [sl, sr] = splitBuffer(buf);
        if (!sl) {
          leftover = buf;
          return readTrunk();
        }
        leftover = buf.slice(0, sl);
        const str = buf.slice(sr).toString(encoding);
        lines = splitLine(str).concat(lines);
      });
  }

  let trimEndBR = () => {
    trimEndBR = () => {};
    if (!lines[lines.length - 1]) lines.pop();
    if (!lines.length && !hasEnd) return readTrunk();
    return Promise.resolve();
  };

  function readLines(size) {
    if (lines.length < size && !hasEnd) {
      return readTrunk()
        .then(trimEndBR)
        .then(() => readLines(size));
    }
    const from = lines.length - Math.min(lines.length, size);
    const result = lines.slice(from);
    lines.length = from;
    return Promise.resolve(result);
  }

  return {
    close() {
      return close(fd);
    },
    readLine() {
      return (!lines.length && !hasEnd ? readTrunk() : Promise.resolve())
        .then(trimEndBR)
        .then(() => lines.pop());
    },
    readLines,
  };
}

export function createStream(filename, options) {
  const reader = create(filename, options);
  return new Readable({
    encoding: 'utf8',
    read() {
      reader.readLine().then((line) => {
        this.push(line === undefined ? null : line);
      });
    },
    destroy(err, cb) {
      reader.close().then(cb);
    }
  });
}

export function readLines(filename, size, options) {
  const reader = create(filename, options);
  return reader.readLines(size).finally(reader.close);
}
