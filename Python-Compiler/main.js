let pyodide = null;
let editor = null;
let inputQueue = [];

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
    appendConsole("✅ <span class='info'>Pyodide loaded. Ready to run Python code!</span>");
}
initPyodide();

// Custom console output
function appendConsole(msg, type="info") {
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerHTML += `<span class="${type}">${msg}</span>\n`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// Input panel
document.getElementById('submit-input').addEventListener('click', () => {
    const value = document.getElementById('user-input').value;
    inputQueue.push(value);
    document.getElementById('user-input').value = "";
});

// Override input() in Pyodide
function setupInput() {
    pyodide.globals.set("input", (promptText) => {
        return inputQueue.shift() || "";
    });
}

// Confetti effect
function triggerConfetti() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
    });
}

// Run user code
document.getElementById('runBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    try {
        setupInput();
        pyodide.stdout = (msg) => appendConsole(msg, "info");
        pyodide.stderr = (msg) => appendConsole("❌ " + msg, "fail");
        await pyodide.runPythonAsync(code);
        appendConsole("🎉 <span class='badge'>Code Ran Successfully!</span>", "success");
        triggerConfetti();
    } catch (err) {
        appendConsole("❌ " + err, "fail");
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
        if (output.includes("FAILED")) {
            appendConsole("💥 <span class='badge'>Tests Failed</span>\n" + output, "fail");
        } else {
            appendConsole("✅ <span class='badge'>All Tests Passed!</span>\n" + output, "success");
            triggerConfetti();
        }
    } catch (err) {
        appendConsole("❌ " + err, "fail");
    }
});
