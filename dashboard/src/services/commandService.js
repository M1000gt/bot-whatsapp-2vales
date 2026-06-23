const { exec } = require('child_process');

function run(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
            resolve(stdout || stderr || err?.message || '');
        });
    });
}

module.exports = {
    run
};
