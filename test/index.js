import path from "path";
import * as rrl from "../src";

describe("read-line", function () {
  it("read one line", async function () {
    const reader = rrl.create(path.join(__dirname, "fixtrues/single-line.txt"));
    await reader.readLine().should.be.fulfilledWith("abc中文cddaaa");
  });

  it("read multi line", async function () {
    const reader = rrl.create(
      path.join(__dirname, "fixtrues/multi-lines.txt"),
      { bufferSize: 2 }
    );
    await reader.readLine().should.be.fulfilledWith("千里江陵一日还。");
    await reader
      .readLine()
      .should.be.fulfilledWith("qian li jiang lin yi ri huan");
    await reader.close();
  });

  it("read lines", async function () {
    const reader = rrl.create(
      path.join(__dirname, "fixtrues/multi-lines.txt"),
      { bufferSize: 2 }
    );
    await reader
      .readLines(2)
      .should.be.fulfilledWith([
        "qian li jiang lin yi ri huan",
        "千里江陵一日还。",
      ]);
    await reader.close();
  });

  it("read lines function", async function () {
    await rrl
      .readLines(path.join(__dirname, "fixtrues/multi-lines.txt"), 2, {
        bufferSize: 2,
      })
      .should.be.fulfilledWith([
        "qian li jiang lin yi ri huan",
        "千里江陵一日还。",
      ]);
  });

  it("read all lines", async function () {
    const reader = rrl.create(
      path.join(__dirname, "fixtrues/multi-lines.txt"),
      { bufferSize: 2 }
    );
    await reader
      .readLines(2)
      .should.be.fulfilledWith([
        "qian li jiang lin yi ri huan",
        "千里江陵一日还。",
      ]);
    await reader
      .readLines(2)
      .should.be.fulfilledWith([
        "huang he yuan shang baiyun jian",
        "黄河远上白云间，",
      ]);
    await reader.close();
  });

  it("read lines by stream", function (done) {
    const stream = rrl.createStream(
      path.join(__dirname, "fixtrues/multi-lines.txt"),
      { bufferSize: 2 }
    );
    const lines = [];
    stream.on("data", l => lines.push(l));
    stream.on("end", () => {
      lines.should.be.deepEqual([
        "千里江陵一日还。",
        "qian li jiang lin yi ri huan",
        "黄河远上白云间，",
        "huang he yuan shang baiyun jian",
      ]);
      done();
    });
  });

  it("read lines CRLF", async function () {
    const reader = rrl.create(
      path.join(__dirname, "fixtrues/multi-lines.win.txt"),
      { bufferSize: 2 }
    );
    await reader
      .readLines(2)
      .should.be.fulfilledWith([
        "qian li jiang lin yi ri huan",
        "千里江陵一日还。",
      ]);
    await reader.close();
  });
});
