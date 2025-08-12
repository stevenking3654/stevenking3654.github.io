(async function () {
  if (document.readyState === 'loading') {
    await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  const MONACO_VERSION = '0.34.0';
  const monacoBase = `https://unpkg.com/monaco-editor@${MONACO_VERSION}/min/`;
  const PYODIDE_SRC = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';

  // Setup Monaco worker
  const workerCode = `
    self.MonacoEnvironment = { baseUrl: '${monacoBase}' };
    importScripts('${monacoBase}vs/base/worker/workerMain.js');
  `;
  const workerBlob = new Blob([workerCode], { type: 'text/javascript' });
  window.MonacoEnvironment = {
    getWorkerUrl: () => URL.createObjectURL(workerBlob)
  };

  // Load Monaco
  await loadScript(monacoBase + 'vs/loader.js');
  const editorReady = new Promise((resolve) => {
    require.config({ paths: { vs: monacoBase + 'vs' } });
    require(['vs/editor/editor.main'], function (monaco) {
      window.editor = monaco.editor.create(document.getElementById('editor'), {
        value: [
          "a = int(input())",
          "b = int(input())",
          "sum = a + b",
          "print(sum)"
        ].join("\n"),
        language: 'python',
        theme: 'vs-light',
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true
      });
      resolve(window.editor);
    });
  });

  // Load Pyodide
  await loadScript(PYODIDE_SRC);
  window.pyodideReady = loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/' });

  // Run Tests for FULL SCRIPTS
  window.runTests = async function () {
    const resultsEl = document.getElementById('results');
    const [editor, pyodide] = await Promise.all([editorReady, window.pyodideReady]);

    const userCode = editor.getValue();
    const testCases = [
      { input: ["2", "3"], expected: "5" },
      { input: ["-1", "1"], expected: "0" },
      { input: ["10", "25"], expected: "35" }
    ];

    let outputLog = [];
    let passed = 0;

    for (const { input, expected } of testCases) {
      try {
        // Create isolated namespace for each run
        const namespace = pyodide.globals.get("dict")();

        // Prepare input() replacement
        pyodide.runPython(`
import sys
from io import StringIO

_input_data = ${JSON.stringify(input)};
_input_index = 0
def input(prompt=None):
    global _input_index
    if _input_index < len(_input_data):
        val = _input_data[_input_index]
        _input_index += 1
        return val
    raise EOFError("No more input")
`, { globals: namespace });

        // Capture print() output
        pyodide.runPython(`
_stdout = StringIO()
sys.stdout = _stdout
`, { globals: namespace });

        // Run user code
        await pyodide.runPythonAsync(userCode, { globals: namespace });

        // Get printed output
        const output = pyodide.runPython(`_stdout.getvalue().strip()`, { globals: namespace });

        if (output === expected) {
          outputLog.push(`✅ Input: ${input.join(", ")} → Output: ${output}`);
          passed++;
        } else {
          outputLog.push(`❌ Input: ${input.join(", ")} → Got: ${output}, Expected: ${expected}`);
        }
      } catch (err) {
        outputLog.push(`❌ Error with input ${input.join(", ")}: ${err}`);
      }
    }

    outputLog.push(`\nScore: ${passed}/${testCases.length}`);
    resultsEl.textContent = outputLog.join("\n");
  };

})();
