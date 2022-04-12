import fs from 'fs';
import util from 'util';
import _ from 'lodash/fp';

const open = util.promisify(fs.open);
const close = util.promisify(fs.close);
const fstat = util.promisify(fs.fstat);
const read = util.promisify(fs.read);

export default class Reader {
  constructor(filename, {
    encoding = 'utf8',
    bufferSize = 4096,
    separator
  } = {}) {
    this.filename = filename;
    this.encoding = encoding;
    this.bufferSize = bufferSize;
    if (separator) {
      const separatorBuffer = Buffer.from(separator, encoding);
      this.splitLine = str => str.split(separator);
      this.splitBuffer = buf => {
        const l = buf.indexOf(separatorBuffer);
        if (l < 0) return [];
        return [l, l + separator.length];
      }
    } else {
      [this.bufCR, this.bufLF] = Buffer.from('\r\n', encoding);
    }
    this.leftover = Buffer.alloc(0);
    this.size = 0;
    this.offset = 0;
  }

  open() {
    return open(this.filename, 'r')
      .then(fd => (this.fd = fd))
      .then(fstat)
      .then(stats => {
        this.size = stats.size;
        this.bufferSize = Math.min(this.size, this.bufferSize)
        this.offset = this.size - this.bufferSize;
        this.buffer = Buffer.alloc(this.bufferSize);
        this.lines = [];
      });
  }

  close() {
    return close(this.fd);
  }

  splitLine(str) {
    return str.split(/\r?\n/);
  }

  splitBuffer(buf) {
    const l = buf.indexOf(this.bufLF, 1);
    if (l < 0) return [];

    const r = l + 1;
    if(buf[l - 1] === this.bufCR) return [l - 1, r];
    return [l, r];
  }

  readTrunk() {
    return read(this.fd, this.buffer, 0, this.bufferSize, this.offset)
      .then(({
        bytesRead,
        buffer
      }) => {
        const buf = Buffer.concat([buffer.slice(0, bytesRead), this.leftover]);
        if (this.offset === 0) {
          this.hasEnd = true;
          const str = buf.toString(this.encoding)
          this.lines = this.splitLine(str)
            .concat(this.lines);
          return;
        }
        if (this.offset < this.bufferSize) {
          this.bufferSize = this.offset;
          this.offset = 0;
        } else {
          this.offset -= this.bufferSize;
        }
        const [sl, sr] = this.splitBuffer(buf);
        if (!sl) {
          this.leftover = buf;
          return this.readTrunk();
        }
        this.leftover = buf.slice(0, sl);
        const str = buf.slice(sr)
          .toString(this.encoding)
        this.lines = this.splitLine(str)
          .concat(this.lines);
      })
  }

  async trimEndBR() {
    const end = this.lines.pop();
    if (end) this.lines.push(end);

    if (_.isEmpty(this.lines) && !this.hasEnd) await this.readTrunk();

    this.trimEndBR = () => {};
  }

  async readLine() {
    if (_.isEmpty(this.lines) && !this.hasEnd) await this.readTrunk();
    await this.trimEndBR();
    return this.lines.pop();
  }

  async readLines(size) {
    if (this.lines.length < size && !this.hasEnd) {
      await this.readTrunk();
      await this.trimEndBR();
      return this.readLines(size);
    }
    const from = this.lines.length - _.min([this.lines.length, size])
    const result = this.lines.slice(from);
    this.lines.length = from;
    return result;
  }
}
