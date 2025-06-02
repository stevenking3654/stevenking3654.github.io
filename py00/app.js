let pyodideReady = loadPyodide();

const testCases = [
  { input: ["3", "4"], expected: "7" },
  { input: ["10", "5"], expected: "15" },
  { input: ["-1", "1"], expected: "0" }
];

async function runTests() {
    const resultsContainer = document.getElementById("results");
    resultsContainer.innerHTML = "Running...";

    const pyodide = await pyodideReady;

    // Load user code
    const userCode = document.getElementById("code").value || await fetch("main.py").then(res => res.text());

    // Load testing logic
    const testRunner = await fetch("test_runner.py").then(res => res.text());

    let testResultsHTML = "";

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];

        const fullCode = `
${testRunner}

user_code = """
${userCode.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}
"""

result, output = run_test_case(user_code, ${JSON.stringify(test.input)}, "${test.expected}")
`;

        try {
            const result = await pyodide.runPythonAsync(fullCode);
            const passed = await pyodide.runPythonAsync("result");
            const output = await pyodide.runPythonAsync("output");

            if (passed) {
                testResultsHTML += `<div class="test-result pass">✅ Test ${i + 1} passed</div>`;
            } else {
                testResultsHTML += `<div class="test-result fail">❌ Test ${i + 1} failed<br><code>Output: ${output}</code></div>`;
            }

        } catch (err) {
            testResultsHTML += `<div class="test-result fail">❌ Test ${i + 1} crashed<br><code>${err}</code></div>`;
        }
    }

    resultsContainer.innerHTML = testResultsHTML;
}
