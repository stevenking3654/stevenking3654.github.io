let pyodide = null;
let editor = null;
let inputQueue = [];
let inputResolve = null;

// ---------- Initialize Monaco ----------
require.config({ paths: { 'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.41.0/min/vs' }});
require(['vs/editor/editor.main'], function () {
    editor = monaco.editor.create(document.getElementById('editor'), {
        value: `# Beginner Python code\n\na = int(input())\nb = int(input())\nprint(a + b)`,
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

// ---------- Run Unit Tests for Beginner Code ----------
document.getElementById('testBtn').addEventListener('click', async () => {
    const code = editor.getValue();
    if (!pyodide) return appendConsole("❌ Pyodide not loaded", "fail");

    // Predefined test inputs and expected outputs
    const testCases = [
        { inputs: ["3","5"], expected: "8" },
        { inputs: ["10","20"], expected: "30" },
    ];

    for (const [index, test] of testCases.entries()) {
        try {
            // Wrap user code with mock input and capture stdout
            const testCode = `
import sys
from io import StringIO

inputs = ${JSON.stringify(test.inputs)}
input_counter = 0
def input(prompt=""):
    global input_counter
    val = inputs[input_counter]
    input_counter += 1
    return val

out = StringIO()
sys.stdout = out

${code}

sys.stdout = sys.__stdout__
result = out.getvalue().strip()
result
`;
            const output = await pyodide.runPythonAsync(testCode);
            if (output === test.expected) {
                appendConsole(`✅ Test ${index + 1} Passed: ${output}`, "success");
            } else {
                appendConsole(`💥 Test ${index + 1} Failed: Expected ${test.expected}, got ${output}`, "fail");
            }
        } catch (err) {
            appendConsole(`❌ Test ${index + 1} Error: ${err}`, "fail");
        }
    }

    triggerConfetti();
});
