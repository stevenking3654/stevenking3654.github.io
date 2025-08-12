(async function () {
  // Wait for DOM ready to ensure #editor and #results exist
  if (document.readyState === 'loading') {
    await new Promise(res => document.addEventListener('DOMContentLoaded', res, { once: true }));
  }

  // Helper to load external script files
  function loadScript(src, attrs = {}) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      Object.keys(attrs).forEach(k => s.setAttribute(k, attrs[k]));
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  // CONFIG: Monaco and Pyodide versions / URLs
  const MONACO_VERSION = '0.34.0';
  const monacoBase = `https://unpkg.com/monaco-editor@${MONACO_VERSION}/min/`;
  const MONACO_LOADER = monacoBase + 'vs/loader.js';
  const PYODIDE_SRC = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
  const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/';

  // Create cross-origin friendly worker blob for Monaco (required on many hosts)
  try {
    const workerCode = `
      self.MonacoEnvironment = { baseUrl: '${monacoBase}' };
      importScripts('${monacoBase}vs/base/worker/workerMain.js');
    `;
    const workerBlob = new Blob([workerCode], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    // Provide getWorkerUrl before loading Monaco
    window.MonacoEnvironment = {
      getWorkerUrl: function () {
        return workerUrl;
      }
    };
  } catch (err) {
    console.warn('Could not create Monaco worker blob:', err);
  }

  // Load Monaco loader
  try {
    await loadScript(MONACO_LOADER);
  } catch (err) {
    console.error('Failed to load Monaco loader:', err);
    const r = document.getElementById('results');
    if (r) r.textContent = 'Error loading editor resources.';
    return;
  }

  // Configure require path and create the editor
  const editorReady = new Promise((resolve, reject) => {
    try {
      // configure require to find the Monaco modules
      if (typeof require !== 'undefined') {
        require.config({ paths: { vs: monacoBase + 'vs' } });
      } else {
        console.warn('RequireJS is not available after loading Monaco loader.');
      }

      // Load the editor main module
      require(['vs/editor/editor.main'], function (monaco) {
        const el = document.getElementById('editor');
        if (!el) {
          reject(new Error('#editor element not found in DOM'));
          return;
        }

        // Create the Monaco editor instance
        window.editor = monaco.editor.create(el, {
          value: [
            "def add_numbers(a, b):",
            "    # Write your code here",
            "    return a + b"
          ].join('\n'),
          language: 'python',
          theme: 'vs-dark',
          fontSize: 14,
          automaticLayout: true,
          minimap: { enabled: false }
        });
        resolve(window.editor);
      }, function (err) {
        reject(err || new Error('Failed to require Monaco editor modules'));
      });
    } catch (err) {
      reject(err);
    }
  });

  // Load Pyodide script and initialize
  try {
    await loadScript(PYODIDE_SRC);
  } catch (err) {
    console.error('Failed to load Pyodide script:', err);
    const r = document.getElementById('results');
    if (r) r.textContent = 'Error loading Python engine.';
    return;
  }

  // Initialize Pyodide (store promise globally so other scripts can reuse)
  window.pyodideReady = loadPyodide({ indexURL: PYODIDE_INDEX_URL });

  // Expose a global runTests function used by the "Run Tests" button
  window.runTests = async function () {
    const resultsEl = document.getElementById('results');
    try {
      // wait for both editor and pyodide to be ready
      const [editor, pyodide] = await Promise.all([editorReady, window.pyodideReady]);

      // get user code from Monaco editor
      const userCode = (editor && typeof editor.getValue === 'function')
        ? editor.getValue()
        : 'def add_numbers(a, b):\\n    return None';

      // test harness (returns a single string)
      const testCode = `
def run_tests():
    tests = [((2, 3), 5), ((-1, 1), 0), ((10, 25), 35)]
    output = []
    passed = 0
    for (a, b), expected in tests:
        try:
            result = add_numbers(a, b)
            if result == expected:
                output.append(f"✅ add_numbers({a}, {b}) == {expected}")
                passed += 1
            else:
                output.append(f"❌ add_numbers({a}, {b}) returned {result}, expected {expected}")
        except Exception as e:
            output.append(f"❌ add_numbers({a}, {b}) raised an error: {e}")
    output.append(f"\\nScore: {passed}/{len(tests)}")
    return "\\n".join(output)
`;

      // Compose final Python code and run asynchronously
      const finalCode = userCode + '\n' + testCode + '\nrun_tests()';

      if (resultsEl) resultsEl.textContent = 'Running tests...';

      // runPythonAsync returns the Python return value as a JS value (string here)
      const result = await pyodide.runPythonAsync(finalCode);

      if (resultsEl) resultsEl.textContent = String(result);
      return result;
    } catch (err) {
      console.error('Error during runTests:', err);
      if (resultsEl) resultsEl.textContent = 'Error running tests: ' + (err && err.message ? err.message : String(err));
      return null;
    }
  };

  // When ready, update UI hint
  try {
    await Promise.all([editorReady, window.pyodideReady]);
    const r = document.getElementById('results');
    if (r) r.textContent = 'Ready — write your code and press "Run Tests"';
  } catch (_) {
    // silent
  }
})();
