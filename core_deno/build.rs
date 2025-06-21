use std::env;
use std::path::Path;
use std::process::{Command, Stdio};

fn main() {
    // Watch for changes in the deno api
    println!("cargo:rerun-if-changed=./core_deno/src/symphony.ts");

    let out_dir = env::var_os("OUT_DIR").unwrap();
    let out_file_dir = Path::new(&out_dir).join("symphony.js");

    // Transpile the deno api
    let res = Command::new("node")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .arg("../node_modules/typescript/lib/tsc.js")
        .arg("./src/symphony.ts")
        .arg("--out")
        .arg(out_file_dir.to_str().unwrap())
        .arg("--target")
        .arg("esnext")
        .arg("-D")
        .output()
        .expect("Could not compile symphony.ts");

    println!("{}", std::str::from_utf8(&res.stderr).unwrap());

    assert!(res.status.success());
}
