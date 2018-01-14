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
    bufferSize = '1024',
    separator = '\n'
  } = {}) {
    this.filename = filename;
    this.encoding = encoding;
    this.bufferSize = bufferSize;
    // todo: default '\r\n' on win; '' on mac
    this.separator = separator;
    this.separatorBuffer = Buffer.from(this.separator, encoding)
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

  readTrunk() {
    return read(this.fd, this.buffer, 0, this.bufferSize, this.offset)
      .then(({
        bytesRead,
        buffer
      }) => {
        // if (bytesRead < this.bufferSize)
        const buf = Buffer.concat([buffer.slice(0, bytesRead), this.leftover]);
        if (this.offset === 0) {
          this.hasEnd = true;
          this.lines = buf.toString(this.encoding).split(this.separator);
          return;
        }
        this.offset = _.max([this.offset, this.bufferSize]) - this.bufferSize;
        const sepIndex = buf.indexOf(this.separatorBuffer);
        if (sepIndex < 0) {
          this.leftover = buf;
          return this.readTrunk();
        }
        this.leftover = buf.slice(0, sepIndex);
        this.lines = buf.slice(sepIndex + this.separatorBuffer.length)
          .toString(this.encoding)
          .split(this.separator)
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
