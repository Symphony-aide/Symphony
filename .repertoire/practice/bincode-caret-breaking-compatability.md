## 🧠 **Big Changes from v1 → v2**

### 🧩 1. **`Options` Trait Removed → Now `Configuration`**

* **v1:** You used the `Options` trait to configure how encoding/decoding worked (e.g., endianness, limits, varint).
* **v2:** That whole system is gone. You *must* use a `Configuration` object instead.
  This is a breaking API change — calls involving `Options` no longer compile in v2. ([docs.rs][1])

Example change:

```rust
// v1
bincode_1::DefaultOptions::new().with_varint_encoding()

// v2
bincode_2::config::legacy().with_variable_int_encoding()
```

👉 `with_varint_encoding()` and others have new names and live on the `Configuration` builder. ([docs.rs][1])

---

### ⚠️ 2. **Function Signatures Changed**

In v1 you could do simple calls like:

```rust
bincode::serialize(&value)
bincode::deserialize(&bytes)
```

In v2 the traditional free functions no longer exist. Instead you must use methods tied to a `Configuration`:

```rust
bincode::serde::encode_to_vec(&value, config)
bincode::serde::decode_from_slice(&bytes, config)
```

So any code relying on the old free functions must be rewritten. ([docs.rs][1])

---

### 🔧 3. **Renamed & Removed Configuration Options**

Several ways you previously configured encoding are now renamed or gone:

| v1 Option                  | v2 Option                                                                 |
| -------------------------- | ------------------------------------------------------------------------- |
| `.with_native_endian()`    | **Removed** — use `.with_big_endian()` or `.with_little_endian()` instead |
| `.with_varint_encoding()`  | `.with_variable_int_encoding()`                                           |
| `.with_fixint_encoding()`  | `.with_fixed_int_encoding()`                                              |
| `.with_limit(n)`           | `.with_limit::<n>()` (const‑generic style)                                |
| `.reject_trailing_bytes()` | **Removed**                                                               |
| `.allow_trailing_bytes()`  | **Removed**                                                               |

Trying to use any of the removed methods in v2 will fail to compile. ([docs.rs][1])

---

### 📦 4. **No More Direct (De)Serialize on `Options`**

In v1 you could have done:

```rust
options.serialize(&value)
```

But in v2 the `Options` trait doesn’t exist.
You can only call serialization/deserialization **via the new `Configuration` API methods** (e.g., `encode_to_vec`, `decode_from_reader`, etc.) ([docs.rs][1])

---

### 📍 5. **serde Integration is Optional but Recommended**

* v2 has an **optional `serde` dependency** — it can be enabled for deriving `Serialize` and `Deserialize`.
* If you want serde‑style workflow, you must enable the `serde` feature. ([docs.rs][1])

This is a functional change in how many users will derive and interop using serde macros.

---

## 🔄 Backward Compatibility Notes

* The *binary encoding format* itself hasn’t fundamentally changed — **bincode v1 and v2 can still read/write the same binary if you use the *same configuration***. ([lib.rs][2])
* But because the **API surface changed (Config vs Options, function names)**, you can’t just bump the crate version without rewriting code. ([docs.rs][1])

---

## ✅ Summary of Breaking Points

1. **`Options` trait removed** → must use `Configuration`.
2. **API rename and removal** — many helper methods changed names or disappeared.
3. **Free serialize/deserialize functions removed**.
4. **serde is now optional** and must be explicitly enabled.

---

[1]: https://docs.rs/bincode/latest/bincode/migration_guide/index.html?utm_source=chatgpt.com "bincode::migration_guide - Rust"
[2]: https://lib.rs/crates/bincode?utm_source=chatgpt.com "Bincode — Rust data encoding library // Lib.rs"
