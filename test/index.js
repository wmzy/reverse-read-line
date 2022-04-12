import path from 'path';
import Reader from '../src';

describe('read-line', function () {
  it('read one line', async function () {
    const reader = new Reader(path.join(__dirname, 'fixtrues/single-line.txt'));
    await reader.open();
    await reader.readLine()
      .should.be.fulfilledWith('abc中文cddaaa');
  });

  it('read multi line', async function () {
    const reader = new Reader(path.join(__dirname, 'fixtrues/multi-lines.txt'), {bufferSize: 2});
    await reader.open();
    await reader.readLine()
      .should.be.fulfilledWith('千里江陵一日还。');
    await reader.readLine()
      .should.be.fulfilledWith('qian li jiang lin yi ri huan');
    await reader.close()
  });

  it('read lines', async function () {
    const reader = new Reader(path.join(__dirname, 'fixtrues/multi-lines.txt'), {bufferSize: 2});
    await reader.open();
    await reader.readLines(2)
      .should.be.fulfilledWith(['qian li jiang lin yi ri huan', '千里江陵一日还。']);
    await reader.close()
  });

  it.only('read all lines', async function () {
    const reader = new Reader(path.join(__dirname, 'fixtrues/multi-lines.txt'), {bufferSize: 2});
    await reader.open();
    await reader.readLines(2)
      .should.be.fulfilledWith(['qian li jiang lin yi ri huan', '千里江陵一日还。']);
    await reader.readLines(2)
      .should.be.fulfilledWith(['huang he yuan shang baiyun jian', '黄河远上白云间，']);
    await reader.close()
  });

  it('read lines CRLF', async function () {
    const reader = new Reader(path.join(__dirname, 'fixtrues/multi-lines.win.txt'), {bufferSize: 2});
    await reader.open();
    await reader.readLines(2)
      .should.be.fulfilledWith(['qian li jiang lin yi ri huan', '千里江陵一日还。']);
    await reader.close()
  });
});

