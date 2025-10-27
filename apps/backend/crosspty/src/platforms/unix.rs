use async_trait::async_trait;
use nix::{
    fcntl::{FcntlArg, OFlag},
    libc,
    pty::{openpty, Winsize},
    sys::{
        signal,
        termios::{self, InputFlags, LocalFlags, SetArg},
    },
    unistd::{self, fork, ForkResult, Pid},
};
use std::{
    ffi::CString,
    fs::File,
    io::{self, Read, Write},
    os::unix::io::{AsRawFd, FromRawFd, RawFd},
    process,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::unix::pipe,
    sync::mpsc,
};
use tokio_util::io::PollEvented;

use crate::{Pty, PtyError, PtyResult, PtySize};

pub struct PtyUnix {
    master: File,
    child_pid: Pid,
    #[allow(dead_code)]
    child_stdin: pipe::Sender,
    child_stdout: pipe::Receiver,
}

impl PtyUnix {
    pub fn new() -> PtyResult<Self> {
        // Create a new PTY pair
        let (master, slave) = openpty(None, None, None, &Winsize {
            ws_row: 24,
            ws_col: 80,
            ws_xpixel: 0,
            ws_ypixel: 0,
        })?;

        // Create pipes for child process I/O
        let (stdin_tx, stdin_rx) = pipe::channel()?;
        let (stdout_tx, stdout_rx) = pipe::channel()?;

        // Fork the process
        match unsafe { fork()? } {
            ForkResult::Parent { child } => {
                // Parent process
                Ok(Self {
                    master: unsafe { File::from_raw_fd(master) },
                    child_pid: child,
                    child_stdin: stdin_tx,
                    child_stdout: stdout_rx,
                })
            }
            ForkResult::Child => {
                // Child process
                // Set up the slave PTY as the controlling terminal
                nix::unistd::setsid()?;
                nix::unistd::dup2(slave, 0)?; // stdin
                nix::unistd::dup2(slave, 1)?; // stdout
                nix::unistd::dup2(slave, 2)?; // stderr

                // Set terminal attributes
                let mut termios = termios::tcgetattr(0)?;
                termios.input_flags &= !(InputFlags::ICRNL | InputFlags::IXON | InputFlags::IXOFF);
                termios.local_flags &=
                    !(LocalFlags::ECHO | LocalFlags::ICANON | LocalFlags::ISIG);
                termios::tcsetattr(0, SetArg::TCSANOW, &termios)?;

                // Execute the shell
                let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
                let shell_cmd = CString::new(shell.clone()).unwrap();
                let shell_name = CString::new(shell.split('/').last().unwrap_or("sh")).unwrap();

                nix::unistd::execv(&shell_cmd, &[&shell_name, &CString::new("-i").unwrap()])
                    .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

                // Should never reach here if execv is successful
                std::process::exit(1);
            }
        }
    }
}

#[async_trait]
impl Pty for PtyUnix {
    async fn write(&self, data: &str) -> PtyResult<()> {
        let mut master = unsafe { File::from_raw_fd(self.master.as_raw_fd()) };
        master.write_all(data.as_bytes())?;
        master.flush()?;
        Ok(())
    }

    async fn resize(&self, (cols, rows): PtySize) -> PtyResult<()> {
        let winsize = libc::winsize {
            ws_row: rows as u16,
            ws_col: cols as u16,
            ws_xpixel: 0,
            ws_ypixel: 0,
        };

        unsafe {
            if libc::ioctl(
                self.master.as_raw_fd(),
                libc::TIOCSWINSZ,
                &winsize as *const _ as *const libc::c_void,
            ) == -1
            {
                return Err(PtyError::IoError(io::Error::last_os_error()));
            }
        }
        Ok(())
    }

    async fn read(&self, buf: &mut [u8]) -> PtyResult<usize> {
        let mut master = unsafe { File::from_raw_fd(self.master.as_raw_fd()) };
        let size = master.read(buf)?;
        Ok(size)
    }

    async fn close(&self) -> PtyResult<()> {
        // Send SIGTERM to the child process
        signal::kill(self.child_pid, signal::SIGTERM)?;
        Ok(())
    }
}
