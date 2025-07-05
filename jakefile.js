import jake from 'jake'
import { spawn } from 'child_process'
import fs from 'fs'
import yaml from 'js-yaml'
import path from 'path'

const { task, desc } = jake


const backkend_path = './backend'
const server_path = `${backkend_path}/server`
const desktop_path = `${backkend_path}/desktop`
const core_path = 'frontend/core'

const build_workspaces = async (workspaces) => {
    console.log('Building all workspaces...')
    for (const workspace of workspaces) {
        try {
            // Check if package.json exists and has a build script
            const packageJsonPath = path.join(process.cwd(), workspace, 'package.json')
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                if (packageJson.scripts && packageJson.scripts.build) {
                    console.log(`Building workspace: ${workspace}`)
                    await run('pnpm', ['build'], workspace)
                } else {
                    console.log(`Skipping ${workspace}: no build script found in package.json`)
                }
            } else {
                console.log(`Skipping ${workspace}: no package.json found`)
            }
        } catch (error) {
            console.error(`Error building workspace ${workspace}:`, error)
            // Continue with other workspaces even if one fails
        }
    }
}

const run_dev_mode = async (workspaces) => {
    console.log('Starting dev mode for all workspaces...')
    for (const workspace of workspaces) {
        try {
            // Check if package.json exists and has a dev script
            const packageJsonPath = path.join(process.cwd(), workspace, 'package.json')
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
                if (packageJson.scripts && packageJson.scripts.dev) {
                    console.log(`Starting dev mode for workspace: ${workspace}`)
                    // Use spawn directly for background processes
                    const proc = spawn('npm', ['run', 'dev'], { 
                        cwd: workspace, 
                        stdio: 'inherit', 
                        shell: true,
                        detached: true 
                    });
                    proc.unref(); // Don't wait for this process
                } else {
                    console.log(`Skipping dev mode for ${workspace}: no dev script found in package.json`)
                }
            }
        } catch (error) {
            console.error(`Error starting dev mode for workspace ${workspace}:`, error)
            // Continue even if one workspace fails
        }
    }
}

const is_empty = (arr) => {
    return arr.length === 0
}

// Get all workspaces except core
const getWorkspacesExceptCore = () => {
    try {
        console.log('Reading workspace configuration...')
        const workspaceFile = fs.readFileSync('./pnpm-workspace.yaml', 'utf8')
        const workspaceData = yaml.load(workspaceFile)
        const workspaces = workspaceData.packages.filter(pkg => !pkg.endsWith('/core'))
        console.log(`Found workspaces: ${workspaces.join(', ')}`)
        return workspaces
    } catch (error) {
        console.error('Error reading workspace file:', error)
        return []
    }
}


const run_server = async () => {
    // Run core in dev mode
    console.log('Starting core in dev mode...')
    await run('npm', ['run', 'dev'], core_path)
    
    // Run the server
    console.log('Starting server...')
    await run('cargo run', [], server_path)
    console.log('Server running at http://localhost:8080/?state=0&token=test')
}

// Easily run commands
const run = (what, args, where = './') => {
    const command = `${what} ${args.join(' ')}`;
    console.log(`Running command: ${command} in ${where}`)
    
    return new Promise((resolve, reject) => {
        // On Windows, use npm run to execute commands
        let proc;
        if (process.platform === 'win32' && what === 'pnpm') {
            // Use npm run instead
            proc = spawn('npm', ['run', args[0]], { 
                cwd: where, 
                stdio: 'inherit', 
                shell: true 
            });
        } else {
            proc = spawn(what, args, { 
                cwd: where, 
                stdio: 'inherit', 
                shell: true 
            });
        }
        
        proc.on('close', (code) => {
            if (code === 0) {
                console.log(`Command completed successfully: ${command}`)
                resolve()
            } else {
                const error = new Error(`Command failed with code ${code}: ${command}`)
                console.error(error.message)
                reject(error)
            }
        })
        
        proc.on('error', (error) => {
            console.error(`Error executing command: ${command}`, error)
            reject(error)
        })
    })
}

desc('Build all workspaces except core');
task('server_build', async function () {
    try {
        console.log('Starting server_build task...')
        const workspaces = getWorkspacesExceptCore()
        if (is_empty(workspaces)) {
            console.warn('No workspaces found to build!')
            return
        }
        
        // Build each workspace
        await build_workspaces(workspaces)
        
        // print state
        console.log('server_build task completed successfully')
    } catch (error) {
        console.error('server_build task failed:', error)
        process.exit(1)
    }
});

desc('Run the server in develop mode');
task('server_dev', async function () {
    try {
        console.log('Starting server task...')
        const workspaces = getWorkspacesExceptCore()
        if (is_empty(workspaces)) {
            console.warn('No workspaces found!')
            return
        }
        
        // First build all workspaces
        await build_workspaces(workspaces)
        
            // Then run dev mode for all workspaces in background
        await run_dev_mode(workspaces)

        // Then run the server
        await run_server()

    } catch (error) {
        console.error('server task failed:', error)
        process.exit(1)
    }
});

desc('Run the core in develop mode');
task('server', async function () {
    await run('npm', ['run', 'dev'], core_path)
    await run('cargo run', [], server_path)
});

desc('Run the desktop in develop mode');
task('desktop', async function () {
    try {
        await run('cargo tauri dev', [], desktop_path)
    } catch (error) {
        console.error('desktop task failed:', error)
        process.exit(1)
    }
});

desc('Build the desktop');
task('build_desktop', async function () {
    try {
        await run('cargo tauri build', [], desktop_path)
    } catch (error) {
        console.error('build_desktop task failed:', error)
        process.exit(1)
    }
});