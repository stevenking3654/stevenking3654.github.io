let pyodide = null;
let editor = null;

// Initialize Monaco Editor
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `# Write your Python code here\n\n`,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true
    });
});

// Initialize Pyodide
async function initPyodide() {
    pyodide = await loadPyodide();
    appendConsole("✅ Pyodide loaded. Ready to run Python code!");
}
initPyodide();

// Custom console output
function appendConsole(msg) {
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerHTML += msg + "\n";
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Override input() in Pyodide
function setupInput() {
    pyodide.globals.set("input", (promptText) => {
        return window.prompt(promptText || "Enter input:");
    });
}

// Run user code
document.getElementById('runBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    try {
        setupInput();
        pyodide.stdout = (msg) => appendConsole(msg);
        pyodide.stderr = (msg) => appendConsole("❌ " + msg);
        await pyodide.runPythonAsync(code);
    } catch (err) {
        appendConsole("❌ " + err);
    }
});

// Run unit tests
document.getElementById('testBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    const testCode = `
import unittest
import sys
from io import StringIO

# Capture output
out = StringIO()
sys.stdout = out

# User code
${code}

# Define tests (replace these with challenge-specific tests)
class TestSolution(unittest.TestCase):
    def test_example(self):
        self.assertEqual(add(5), 10)  # Example test; replace with real tests

# Run tests
suite = unittest.TestLoader().loadTestsFromTestCase(TestSolution)
runner = unittest.TextTestRunner(stream=out, verbosity=2)
result = runner.run(suite)

sys.stdout = sys.__stdout__
out.getvalue()
`;
    try {
        const output = await pyodide.runPythonAsync(testCode);
        appendConsole("🧪 Test Results:\n" + output);
    } catch (err) {
        appendConsole("❌ " + err);
    }
});
