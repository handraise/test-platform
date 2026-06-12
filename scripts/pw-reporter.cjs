/**
 * Minimal Playwright reporter that emits one NDJSON line per lifecycle event
 * to stdout, prefixed so iBud's runner can pick them out of mixed output.
 * The runner parses these to stream per-test status + screenshots.
 */
const PREFIX = "@@IBUD@@";

class IbudReporter {
  emit(obj) {
    process.stdout.write(PREFIX + JSON.stringify(obj) + "\n");
  }

  onBegin(_config, suite) {
    this.emit({ type: "begin", total: suite.allTests().length });
  }

  onTestBegin(test) {
    this.emit({ type: "testBegin", title: test.title });
  }

  onTestEnd(test, result) {
    const find = (name) => {
      const a = result.attachments.find((x) => x.name === name && x.path);
      return a ? a.path : undefined;
    };
    this.emit({
      type: "testEnd",
      title: test.title,
      status: result.status, // passed | failed | timedOut | skipped | interrupted
      durationMs: result.duration,
      error: result.error ? stripAnsi(result.error.message || "") : undefined,
      screenshot: find("screenshot"),
      trace: find("trace"),
      video: find("video"),
    });
  }

  onEnd(result) {
    this.emit({ type: "end", status: result.status });
  }

  printsToStdio() {
    return false;
  }
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\[[0-9;]*m/g, "").slice(0, 600);
}

module.exports = IbudReporter;
