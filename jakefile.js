const { task, desc } = require('jake')
const { spawn } = require('child_process')

// Easily run commands
const run  = (what, args, where = './') => {
    return new Promise((resolve, reject) => {
        let proc = spawn(what, args, { cwd: where, stdio: 'inherit', shell: true});
        proc.on('close', (code) => code === 0 ? resolve() : reject())
    })
}

const backkend_path = './backend'
const server_path = `${backkend_path}/server`
const desktop_path = `${backkend_path}/desktop`
const core_path = 'core'

desc('Run the server in develop mode');
task('server', async function () {
    await run('pnpm', ['run', '--filter', core_path, 'dev'])
    await run('cargo run', [], server_path)
});

desc('Run the desktop in develop mode');
task('desktop', async function () {
    await run('cargo tauri dev', [], desktop_path)
});

desc('Build the desktop');
task('build:desktop', async function () {
    await run('cargo tauri build', [], desktop_path)
});
