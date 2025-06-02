import sys
from io import StringIO

def run_test_case(user_code, inputs, expected_output):
    input_values = inputs.copy()

    def mock_input(prompt=None):
        return input_values.pop(0)

    # Set up environment
    sys.modules['builtins'].input = mock_input
    old_stdout = sys.stdout
    sys.stdout = mystdout = StringIO()

    try:
        exec(user_code, {})
        output = mystdout.getvalue().strip()
        passed = output == expected_output
    except Exception as e:
        return False, str(e)
    finally:
        sys.stdout = old_stdout

    return passed, output
