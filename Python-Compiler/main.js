let pyodide = null;
let editor = null;
let inputQueue = [];
let inputResolve = null;

// ---------- Initialize Monaco ----------
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `# Write your Python code here\n\ndef add(x):\n    return x + 5\n\na = int(input("Enter a number: "))\nprint("Result:", add(a))`,
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true
    });
});

// ---------- Initialize Pyodide ----------
async function initPyodide() {
    pyodide = await loadPyodide();
    appendConsole("✅ <span class='info'>Pyodide loaded. Ready!</span>");
    document.getElementById('runBtn').disabled = false;
    document.getElementById('testBtn').disabled = false;
}
initPyodide();

// ---------- Console ----------
function appendConsole(msg, type="info") {
    const consoleDiv = document.getElementById('console');
    consoleDiv.innerHTML += `<span class="${type}">${msg}</span>\n`;
    consoleDiv.scrollTop = consoleDiv.scrollHeight;
}

// ---------- Confetti ----------
function triggerConfetti() {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

// ---------- Input Handling ----------
document.getElementById('submit-input').addEventListener('click', () => {
    const value = document.getElementById('user-input').value;
    document.getElementById('user-input').value = "";
    document.getElementById('input-panel').style.display = "none";
    if (inputResolve) {
        inputResolve(value);
        inputResolve = null;
    } else {
        inputQueue.push(value);
    }
});

// Returns a Promise that resolves when user submits input
function getUserInput(promptText="") {
    return new Promise((resolve) => {
        inputResolve = resolve;
        document.getElementById('input-panel').style.display = "flex";
        document.getElementById('user-input').focus();
    });
}

// ---------- Run Code ----------
document.getElementById('runBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    if (!pyodide) return appendConsole("❌ Pyodide not loaded", "fail");
    try {
        // Override input() dynamically
        pyodide.globals.set("input", getUserInput);
        pyodide.stdout = (msg) => appendConsole(msg, "info");
        pyodide.stderr = (msg) => appendConsole("❌ " + msg, "fail");
        await pyodide.runPythonAsync(code);
        appendConsole("🎉 <span class='badge'>Code Ran Successfully!</span>", "success");
        triggerConfetti();
    } catch (err) {
        appendConsole("❌ " + err, "fail");
    }
});

// ---------- Run Unit Tests ----------
document.getElementById('testBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    if (!pyodide) return appendConsole("❌ Pyodide not loaded", "fail");

    const testCode = `
import unittest
from io import StringIO
import sys

# Capture output
out = StringIO()
sys.stdout = out

${code}

# Example tests
class TestSolution(unittest.TestCase):
    def test_add(self):
        self.assertEqual(add(5), 10)
        self.assertEqual(add(0), 5)

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
