const { spawn } = require('child_process');

const getPythonExecutable = () => {
  if (process.env.PYTHON_EXECUTABLE) {
    return process.env.PYTHON_EXECUTABLE;
  }

  return 'python';
};

const runPythonScript = (scriptPath, args = []) =>
  new Promise((resolve, reject) => {
    const python = spawn(getPythonExecutable(), [scriptPath, ...args], {
      cwd: process.cwd(),
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', data => {
      stdout += data.toString();
    });

    python.stderr.on('data', data => {
      stderr += data.toString();
    });

    python.on('error', error => {
      reject(error);
    });

    python.on('close', code => {
      if (code !== 0) {
        return reject(new Error(stderr || `El script Python finalizo con codigo ${code}`));
      }

      resolve({
        stdout: stdout.trim(),
        stderr: stderr.trim()
      });
    });
  });

module.exports = {
  runPythonScript
};
