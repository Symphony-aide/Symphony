# F007 - Python Bridge Foundation - Design

**Feature ID**: F007  
**Design Date**: December 28, 2025  
**Architecture**: Python-Rust FFI integration with direct Pit access  
**Implementation**: PyO3 bindings + type conversion + async integration + subprocess management  

---

## System Architecture

### Python-Rust Bridge Architecture Overview
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PYTHON-RUST INTEGRATION BRIDGE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        SYMPHONY RUST PROCESS                           │ │
│  │                                                                        │ │
│  │   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │ │
│  │   │   PyO3 FFI      │  │   Type          │  │   Async         │      │ │
│  │   │   Bindings      │  │   Conversion    │  │   Bridge        │      │ │
│  │   │                 │  │   System        │  │                 │      │ │
│  │   │• <0.01ms calls  │  │• Bidirectional  │  │• Tokio ↔        │      │ │
│  │   │• Memory safe    │  │• Lossless       │  │  asyncio        │      │ │
│  │   │• Error prop     │  │• Performance    │  │• Cancellation   │      │ │
│  │   │• Thread safe    │  │• Type safety    │  │• Error prop     │      │ │
│  │   └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘      │ │
│  │             │                    │                    │                │ │
│  │             └────────────────────┼────────────────────┘                │ │
│  │                                  │                                     │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    Direct Pit Access Layer                        │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │ Pool Manager │ │ DAG Tracker  │ │ Artifact     │ │Arbitration│ │ │
│  │   │  │   Access     │ │   Access     │ │ Store Access │ │  Engine   │ │ │
│  │   │  │              │ │              │ │              │ │  Access   │ │ │
│  │   │  │• No IPC      │ │• No IPC      │ │• No IPC      │ │• No IPC   │ │ │
│  │   │  │• Direct      │ │• Direct      │ │• Direct      │ │• Direct   │ │ │
│  │   │  │  function    │ │  function    │ │  function    │ │  function │ │ │
│  │   │  │  calls       │ │  calls       │ │  calls       │ │  calls    │ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  │                                  │                                     │ │
│  └──────────────────────────────────┼─────────────────────────────────────┘ │
│                                     │                                       │
│                              Python Subprocess                               │
│                                     │                                       │
│  ┌──────────────────────────────────┼─────────────────────────────────────┐ │
│  │                    PYTHON CONDUCTOR SUBPROCESS                         │ │
│  │                                  │                                      │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    Python Runtime Environment                     │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │   Symphony   │ │   Asyncio    │ │   AI/ML      │ │  Pit     │ │ │
│  │   │  │   Bridge     │ │  Integration │ │  Libraries   │ │ Direct   │ │ │
│  │   │  │   Module     │ │              │ │              │ │ Access   │ │ │
│  │   │  │              │ │• Event loop  │ │• TensorFlow  │ │          │ │ │
│  │   │  │• FFI calls   │ │• Coroutines  │ │• PyTorch     │ │• Pool    │ │ │
│  │   │  │• Type conv   │ │• Futures     │ │• Transformers│ │• DAG     │ │ │
│  │   │  │• Error hand  │ │• Cancellation│ │• Custom AI   │ │• Artifact│ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  │                                  │                                      │ │
│  │   ┌─────────────────────────────┴─────────────────────────────────────┐ │
│  │   │                    Conductor AI Engine                            │ │
│  │   │                                                                   │ │
│  │   │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐ │ │
│  │   │  │ Reinforcement│ │   Decision   │ │   Workflow   │ │  Model   │ │ │
│  │   │  │   Learning   │ │    Making    │ │ Orchestration│ │ Management│ │ │
│  │   │  │              │ │              │ │              │ │          │ │ │
│  │   │  │• FQG trained │ │• Context     │ │• AI workflows│ │• Loading │ │ │
│  │   │  │• Policy      │ │  analysis    │ │• Resource    │ │• Caching │ │ │
│  │   │  │  optimization│ │• Multi-      │ │  allocation  │ │• Lifecycle│ │ │
│  │   │  │• Reward      │ │  criteria    │ │• Failure     │ │• Health  │ │ │
│  │   │  │  functions   │ │  decisions   │ │  recovery    │ │  monitor │ │ │
│  │   │  └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘ │ │
│  │   └───────────────────────────────────────────────────────────────────┘ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Design

### 1. PyO3 FFI Bindings (`src/lib.rs`, `src/bindings.rs`)

#### Core Python Module Definition
```rust
use pyo3::prelude::*;
use pyo3::types::{PyDict, PyList, PyTuple};
use std::sync::Arc;

#[pymodule]
fn symphony_bridge(_py: Python, m: &PyModule) -> PyResult<()> {
    // Register core types
    m.add_class::<PitManager>()?;
    m.add_class::<WorkflowExecutor>()?;
    m.add_class::<ModelHandle>()?;
    m.add_class::<ArtifactStore>()?;
    
    // Register functions
    m.add_function(wrap_pyfunction!(create_pit_manager, m)?)?;
    m.add_function(wrap_pyfunction!(get_system_info, m)?)?;
    m.add_function(wrap_pyfunction!(setup_logging, m)?)?;
    
    // Register constants
    m.add("VERSION", env!("CARGO_PKG_VERSION"))?;
    m.add("BUILD_INFO", get_build_info())?;
    
    Ok(())
}

#[pyclass]
pub struct PitManager {
    inner: Arc<symphony_pit::PitManager>,
}

#[pymethods]
impl PitManager {
    #[new]
    fn new() -> PyResult<Self> {
        let pit_manager = symphony_pit::PitManager::new()
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(Self {
            inner: Arc::new(pit_manager),
        })
    }
    
    fn allocate_model(&self, py: Python, spec: &PyDict) -> PyResult<PyObject> {
        let start = std::time::Instant::now();
        
        // Convert Python dict to Rust ModelSpec
        let model_spec = ModelSpec::from_py_dict(spec)?;
        
        // Call Rust function directly (no IPC)
        let handle = py.allow_threads(|| {
            self.inner.allocate_model(model_spec)
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        let call_time = start.elapsed();
        if call_time > std::time::Duration::from_nanos(10_000) {
            pyo3::Python::with_gil(|py| {
                let warnings = py.import("warnings")?;
                warnings.call_method1("warn", (
                    format!("Pit allocation took {}μs (target: <0.01ms)", call_time.as_micros()),
                ))?;
                Ok::<(), PyErr>(())
            }).ok();
        }
        
        // Convert Rust ModelHandle to Python object
        let py_handle = ModelHandle { inner: handle };
        Ok(py_handle.into_py(py))
    }
    
    fn execute_workflow(&self, py: Python, workflow_def: &PyDict) -> PyResult<PyObject> {
        let workflow = WorkflowDefinition::from_py_dict(workflow_def)?;
        
        let result = py.allow_threads(|| {
            self.inner.execute_workflow(workflow)
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(result.to_py_object(py))
    }
    
    fn store_artifact(&self, py: Python, data: &PyAny) -> PyResult<String> {
        let artifact_data = ArtifactData::from_py_any(data)?;
        
        let artifact_id = py.allow_threads(|| {
            self.inner.store_artifact(artifact_data)
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(artifact_id.to_string())
    }
    
    fn get_artifact(&self, py: Python, artifact_id: &str) -> PyResult<PyObject> {
        let id = ArtifactId::from_str(artifact_id)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        
        let artifact = py.allow_threads(|| {
            self.inner.retrieve_artifact(id)
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(artifact.to_py_object(py))
    }
}

#[pyclass]
pub struct ModelHandle {
    inner: symphony_pit::ModelHandle,
}

#[pymethods]
impl ModelHandle {
    fn get_status(&self, py: Python) -> PyResult<PyObject> {
        let status = py.allow_threads(|| {
            self.inner.get_status()
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(status.to_py_object(py))
    }
    
    fn invoke(&self, py: Python, input_data: &PyAny) -> PyResult<PyObject> {
        let input = ModelInput::from_py_any(input_data)?;
        
        let output = py.allow_threads(|| {
            self.inner.invoke(input)
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(output.to_py_object(py))
    }
    
    fn deallocate(&self, py: Python) -> PyResult<()> {
        py.allow_threads(|| {
            self.inner.deallocate()
        }).map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
        
        Ok(())
    }
}

#[pyfunction]
fn create_pit_manager() -> PyResult<PitManager> {
    PitManager::new()
}

#[pyfunction]
fn get_system_info(py: Python) -> PyResult<PyObject> {
    let info = symphony_core::get_system_info();
    Ok(info.to_py_object(py))
}

#[pyfunction]
fn setup_logging(level: &str) -> PyResult<()> {
    symphony_core::setup_logging(level)
        .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
    Ok(())
}
```
### 2. Type Conversion System (`src/types.rs`)

#### Bidirectional Rust ↔ Python Type Conversion
```rust
use pyo3::prelude::*;
use pyo3::types::{PyDict, PyList, PyTuple, PyString, PyInt, PyFloat, PyBool};
use std::collections::HashMap;

pub trait ToPyObject {
    fn to_py_object(&self, py: Python) -> PyObject;
}

pub trait FromPyAny: Sized {
    fn from_py_any(obj: &PyAny) -> PyResult<Self>;
}

// Primitive type conversions
impl ToPyObject for ModelSpec {
    fn to_py_object(&self, py: Python) -> PyObject {
        let dict = PyDict::new(py);
        dict.set_item("name", &self.name).unwrap();
        dict.set_item("version", &self.version).unwrap();
        dict.set_item("model_type", self.model_type.to_string()).unwrap();
        
        // Convert resource requirements
        let resources = PyDict::new(py);
        resources.set_item("memory_mb", self.resource_requirements.memory_mb).unwrap();
        resources.set_item("cpu_cores", self.resource_requirements.cpu_cores).unwrap();
        if let Some(gpu_memory) = self.resource_requirements.gpu_memory_mb {
            resources.set_item("gpu_memory_mb", gpu_memory).unwrap();
        }
        dict.set_item("resource_requirements", resources).unwrap();
        
        // Convert configuration
        let config = PyDict::new(py);
        for (key, value) in &self.configuration {
            let py_value = serde_json_to_py_object(py, value);
            config.set_item(key, py_value).unwrap();
        }
        dict.set_item("configuration", config).unwrap();
        
        dict.into()
    }
}

impl FromPyAny for ModelSpec {
    fn from_py_any(obj: &PyAny) -> PyResult<Self> {
        let dict = obj.downcast::<PyDict>()?;
        
        let name = dict.get_item("name")
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'name' field"))?
            .extract::<String>()?;
        
        let version = dict.get_item("version")
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'version' field"))?
            .extract::<String>()?;
        
        let model_type_str = dict.get_item("model_type")
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'model_type' field"))?
            .extract::<String>()?;
        let model_type = ModelType::from_str(&model_type_str)
            .map_err(|e| PyErr::new::<pyo3::exceptions::PyValueError, _>(e.to_string()))?;
        
        // Convert resource requirements
        let resources_dict = dict.get_item("resource_requirements")
            .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'resource_requirements' field"))?
            .downcast::<PyDict>()?;
        
        let resource_requirements = ResourceRequirements {
            memory_mb: resources_dict.get_item("memory_mb")
                .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'memory_mb' field"))?
                .extract::<u64>()?,
            cpu_cores: resources_dict.get_item("cpu_cores")
                .ok_or_else(|| PyErr::new::<pyo3::exceptions::PyKeyError, _>("Missing 'cpu_cores' field"))?
                .extract::<f32>()?,
            gpu_memory_mb: resources_dict.get_item("gpu_memory_mb")
                .map(|v| v.extract::<u64>())
                .transpose()?,
            network_access: resources_dict.get_item("network_access")
                .map(|v| v.extract::<bool>())
                .transpose()?
                .unwrap_or(false),
        };
        
        // Convert configuration
        let mut configuration = HashMap::new();
        if let Some(config_dict) = dict.get_item("configuration") {
            let config_dict = config_dict.downcast::<PyDict>()?;
            for (key, value) in config_dict.iter() {
                let key_str = key.extract::<String>()?;
                let json_value = py_object_to_serde_json(value)?;
                configuration.insert(key_str, json_value);
            }
        }
        
        Ok(ModelSpec {
            name,
            version,
            model_type,
            resource_requirements,
            configuration,
        })
    }
}

// Collection type conversions
impl<T: ToPyObject> ToPyObject for Vec<T> {
    fn to_py_object(&self, py: Python) -> PyObject {
        let list = PyList::empty(py);
        for item in self {
            list.append(item.to_py_object(py)).unwrap();
        }
        list.into()
    }
}

impl<T: FromPyAny> FromPyAny for Vec<T> {
    fn from_py_any(obj: &PyAny) -> PyResult<Self> {
        let list = obj.downcast::<PyList>()?;
        let mut result = Vec::with_capacity(list.len());
        
        for item in list.iter() {
            result.push(T::from_py_any(item)?);
        }
        
        Ok(result)
    }
}

impl<T: ToPyObject> ToPyObject for HashMap<String, T> {
    fn to_py_object(&self, py: Python) -> PyObject {
        let dict = PyDict::new(py);
        for (key, value) in self {
            dict.set_item(key, value.to_py_object(py)).unwrap();
        }
        dict.into()
    }
}

impl<T: FromPyAny> FromPyAny for HashMap<String, T> {
    fn from_py_any(obj: &PyAny) -> PyResult<Self> {
        let dict = obj.downcast::<PyDict>()?;
        let mut result = HashMap::new();
        
        for (key, value) in dict.iter() {
            let key_str = key.extract::<String>()?;
            let value_t = T::from_py_any(value)?;
            result.insert(key_str, value_t);
        }
        
        Ok(result)
    }
}

// Utility functions for JSON conversion
fn serde_json_to_py_object(py: Python, value: &serde_json::Value) -> PyObject {
    match value {
        serde_json::Value::Null => py.None(),
        serde_json::Value::Bool(b) => b.into_py(py),
        serde_json::Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                i.into_py(py)
            } else if let Some(f) = n.as_f64() {
                f.into_py(py)
            } else {
                py.None()
            }
        }
        serde_json::Value::String(s) => s.into_py(py),
        serde_json::Value::Array(arr) => {
            let list = PyList::empty(py);
            for item in arr {
                list.append(serde_json_to_py_object(py, item)).unwrap();
            }
            list.into()
        }
        serde_json::Value::Object(obj) => {
            let dict = PyDict::new(py);
            for (key, value) in obj {
                dict.set_item(key, serde_json_to_py_object(py, value)).unwrap();
            }
            dict.into()
        }
    }
}

fn py_object_to_serde_json(obj: &PyAny) -> PyResult<serde_json::Value> {
    if obj.is_none() {
        Ok(serde_json::Value::Null)
    } else if let Ok(b) = obj.extract::<bool>() {
        Ok(serde_json::Value::Bool(b))
    } else if let Ok(i) = obj.extract::<i64>() {
        Ok(serde_json::Value::Number(serde_json::Number::from(i)))
    } else if let Ok(f) = obj.extract::<f64>() {
        if let Some(n) = serde_json::Number::from_f64(f) {
            Ok(serde_json::Value::Number(n))
        } else {
            Err(PyErr::new::<pyo3::exceptions::PyValueError, _>("Invalid float value"))
        }
    } else if let Ok(s) = obj.extract::<String>() {
        Ok(serde_json::Value::String(s))
    } else if let Ok(list) = obj.downcast::<PyList>() {
        let mut arr = Vec::new();
        for item in list.iter() {
            arr.push(py_object_to_serde_json(item)?);
        }
        Ok(serde_json::Value::Array(arr))
    } else if let Ok(dict) = obj.downcast::<PyDict>() {
        let mut map = serde_json::Map::new();
        for (key, value) in dict.iter() {
            let key_str = key.extract::<String>()?;
            let value_json = py_object_to_serde_json(value)?;
            map.insert(key_str, value_json);
        }
        Ok(serde_json::Value::Object(map))
    } else {
        Err(PyErr::new::<pyo3::exceptions::PyTypeError, _>("Unsupported type for JSON conversion"))
    }
}

// Error type conversion
impl From<symphony_core::SymphonyError> for PyErr {
    fn from(err: symphony_core::SymphonyError) -> Self {
        match err {
            symphony_core::SymphonyError::ValidationError(msg) => {
                PyErr::new::<pyo3::exceptions::PyValueError, _>(msg)
            }
            symphony_core::SymphonyError::ResourceExhausted(msg) => {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(format!("Resource exhausted: {}", msg))
            }
            symphony_core::SymphonyError::PortOperation(msg) => {
                PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(format!("Port operation failed: {}", msg))
            }
            _ => PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(err.to_string()),
        }
    }
}
```

### 3. Async Integration (`src/async_support.rs`)

#### Python Asyncio ↔ Rust Async/await Bridge
```rust
use pyo3::prelude::*;
use pyo3_asyncio::tokio::{future_into_py, local_future_into_py};
use tokio::sync::oneshot;
use std::future::Future;

pub struct AsyncBridge {
    runtime_handle: tokio::runtime::Handle,
}

impl AsyncBridge {
    pub fn new() -> Self {
        Self {
            runtime_handle: tokio::runtime::Handle::current(),
        }
    }
    
    pub fn spawn_rust_future<F, T>(&self, py: Python, future: F) -> PyResult<PyObject>
    where
        F: Future<Output = Result<T, symphony_core::SymphonyError>> + Send + 'static,
        T: ToPyObject + Send + 'static,
    {
        let handle = self.runtime_handle.clone();
        
        future_into_py(py, async move {
            let result = future.await
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
            
            Python::with_gil(|py| Ok(result.to_py_object(py)))
        })
    }
    
    pub async fn call_python_async<T>(&self, py_coro: PyObject) -> PyResult<T>
    where
        T: FromPyAny,
    {
        let (tx, rx) = oneshot::channel();
        
        Python::with_gil(|py| {
            let asyncio = py.import("asyncio")?;
            let task = asyncio.call_method1("create_task", (py_coro,))?;
            
            // Set up completion callback
            let callback = PyFunction::new_closure(py, None, None, move |args: &PyTuple, _kwargs: Option<&PyDict>| {
                let result = args.get_item(0)?;
                
                if result.hasattr("exception")? {
                    let exception = result.call_method0("exception")?;
                    if !exception.is_none() {
                        let _ = tx.send(Err(PyErr::from_value(exception)));
                        return Ok(py.None());
                    }
                }
                
                let value = result.call_method0("result")?;
                let converted = T::from_py_any(value)
                    .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
                
                let _ = tx.send(Ok(converted));
                Ok(py.None())
            })?;
            
            task.call_method1("add_done_callback", (callback,))?;
            
            Ok::<(), PyErr>(())
        })?;
        
        rx.await
            .map_err(|_| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Callback channel closed"))?
    }
    
    pub fn create_python_future<F, T>(&self, py: Python, rust_future: F) -> PyResult<PyObject>
    where
        F: Future<Output = Result<T, symphony_core::SymphonyError>> + Send + 'static,
        T: ToPyObject + Send + 'static,
    {
        let asyncio = py.import("asyncio")?;
        let loop_obj = asyncio.call_method0("get_event_loop")?;
        
        let (tx, rx) = oneshot::channel();
        
        // Spawn Rust future on Tokio runtime
        self.runtime_handle.spawn(async move {
            let result = rust_future.await;
            let _ = tx.send(result);
        });
        
        // Create Python future that waits for Rust result
        let py_future = loop_obj.call_method0("create_future")?;
        let future_clone = py_future.clone();
        
        // Spawn Python task to wait for result
        let wait_task = pyo3_asyncio::tokio::future_into_py(py, async move {
            let result = rx.await
                .map_err(|_| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>("Rust future channel closed"))?;
            
            Python::with_gil(|py| {
                match result {
                    Ok(value) => {
                        let py_value = value.to_py_object(py);
                        future_clone.call_method1("set_result", (py_value,))?;
                    }
                    Err(error) => {
                        let py_error = PyErr::from(error);
                        future_clone.call_method1("set_exception", (py_error,))?;
                    }
                }
                Ok(py.None())
            })
        })?;
        
        // Return the Python future
        Ok(py_future.into())
    }
}

// Async method wrappers for PyO3 classes
#[pymethods]
impl PitManager {
    fn allocate_model_async(&self, py: Python, spec: &PyDict) -> PyResult<PyObject> {
        let model_spec = ModelSpec::from_py_dict(spec)?;
        let pit_manager = self.inner.clone();
        
        future_into_py(py, async move {
            let handle = pit_manager.allocate_model_async(model_spec).await
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
            
            Python::with_gil(|py| {
                let py_handle = ModelHandle { inner: handle };
                Ok(py_handle.into_py(py))
            })
        })
    }
    
    fn execute_workflow_async(&self, py: Python, workflow_def: &PyDict) -> PyResult<PyObject> {
        let workflow = WorkflowDefinition::from_py_dict(workflow_def)?;
        let pit_manager = self.inner.clone();
        
        future_into_py(py, async move {
            let result = pit_manager.execute_workflow_async(workflow).await
                .map_err(|e| PyErr::new::<pyo3::exceptions::PyRuntimeError, _>(e.to_string()))?;
            
            Python::with_gil(|py| Ok(result.to_py_object(py)))
        })
    }
}

// Cancellation support
pub struct CancellableTask {
    cancel_token: tokio_util::sync::CancellationToken,
    task_handle: tokio::task::JoinHandle<()>,
}

impl CancellableTask {
    pub fn new<F>(future: F) -> Self
    where
        F: Future<Output = ()> + Send + 'static,
    {
        let cancel_token = tokio_util::sync::CancellationToken::new();
        let cancel_token_clone = cancel_token.clone();
        
        let task_handle = tokio::spawn(async move {
            tokio::select! {
                _ = future => {}
                _ = cancel_token_clone.cancelled() => {
                    tracing::debug!("Task cancelled");
                }
            }
        });
        
        Self {
            cancel_token,
            task_handle,
        }
    }
    
    pub fn cancel(&self) {
        self.cancel_token.cancel();
    }
    
    pub async fn join(self) -> Result<(), tokio::task::JoinError> {
        self.task_handle.await
    }
}

#[pyclass]
pub struct PyCancellableTask {
    inner: Option<CancellableTask>,
}

#[pymethods]
impl PyCancellableTask {
    fn cancel(&mut self) {
        if let Some(task) = &self.inner {
            task.cancel();
        }
    }
    
    fn is_cancelled(&self) -> bool {
        self.inner.as_ref()
            .map(|task| task.cancel_token.is_cancelled())
            .unwrap_or(true)
    }
}
```

### 4. Subprocess Management (`src/subprocess.rs`)

#### Python Conductor Process Lifecycle
```rust
use tokio::process::{Child, Command};
use tokio::sync::{mpsc, RwLock};
use std::path::PathBuf;

pub struct PythonSubprocessManager {
    process: RwLock<Option<Child>>,
    config: PythonConfig,
    status_sender: mpsc::UnboundedSender<SubprocessStatus>,
    health_monitor: HealthMonitor,
}

impl PythonSubprocessManager {
    pub fn new(config: PythonConfig) -> (Self, mpsc::UnboundedReceiver<SubprocessStatus>) {
        let (status_sender, status_receiver) = mpsc::unbounded_channel();
        
        let manager = Self {
            process: RwLock::new(None),
            config,
            status_sender,
            health_monitor: HealthMonitor::new(),
        };
        
        (manager, status_receiver)
    }
    
    pub async fn start_conductor(&self) -> Result<(), SubprocessError> {
        let start_time = std::time::Instant::now();
        
        // Build Python command
        let mut command = Command::new(&self.config.python_executable);
        command.args(&["-m", "symphony_conductor"]);
        command.args(&self.config.args);
        
        // Set up environment
        command.env("PYTHONPATH", &self.config.python_path);
        command.env("SYMPHONY_BRIDGE_MODE", "subprocess");
        for (key, value) in &self.config.environment {
            command.env(key, value);
        }
        
        // Set up stdio
        command.stdin(std::process::Stdio::piped());
        command.stdout(std::process::Stdio::piped());
        command.stderr(std::process::Stdio::piped());
        
        // Set working directory
        if let Some(working_dir) = &self.config.working_directory {
            command.current_dir(working_dir);
        }
        
        // Spawn process
        let child = command.spawn()
            .map_err(|e| SubprocessError::SpawnFailed(e.to_string()))?;
        
        let startup_time = start_time.elapsed();
        if startup_time > std::time::Duration::from_secs(5) {
            tracing::warn!("Python Conductor startup took {}ms (target: <5s)", startup_time.as_millis());
        }
        
        // Store process handle
        {
            let mut process = self.process.write().await;
            *process = Some(child);
        }
        
        // Start health monitoring
        self.start_health_monitoring().await;
        
        // Wait for conductor to be ready
        self.wait_for_ready().await?;
        
        let _ = self.status_sender.send(SubprocessStatus::Started);
        tracing::info!("Python Conductor started successfully");
        
        Ok(())
    }
    
    pub async fn stop_conductor(&self) -> Result<(), SubprocessError> {
        let mut process = self.process.write().await;
        
        if let Some(mut child) = process.take() {
            // Send shutdown signal
            if let Some(stdin) = child.stdin.take() {
                // Send graceful shutdown command
                let shutdown_cmd = serde_json::json!({
                    "command": "shutdown",
                    "graceful": true
                });
                
                if let Err(e) = self.send_command_to_process(&mut child, shutdown_cmd).await {
                    tracing::warn!("Failed to send graceful shutdown command: {}", e);
                }
            }
            
            // Wait for graceful shutdown
            match tokio::time::timeout(std::time::Duration::from_secs(10), child.wait()).await {
                Ok(Ok(exit_status)) => {
                    tracing::info!("Python Conductor exited gracefully: {:?}", exit_status);
                }
                Ok(Err(e)) => {
                    tracing::error!("Error waiting for Conductor exit: {}", e);
                }
                Err(_) => {
                    // Force kill if graceful shutdown times out
                    tracing::warn!("Conductor graceful shutdown timed out, force killing");
                    if let Err(e) = child.kill().await {
                        tracing::error!("Failed to kill Conductor process: {}", e);
                    }
                }
            }
        }
        
        let _ = self.status_sender.send(SubprocessStatus::Stopped);
        Ok(())
    }
    
    pub async fn restart_conductor(&self) -> Result<(), SubprocessError> {
        tracing::info!("Restarting Python Conductor");
        
        self.stop_conductor().await?;
        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        self.start_conductor().await?;
        
        let _ = self.status_sender.send(SubprocessStatus::Restarted);
        Ok(())
    }
    
    pub async fn is_running(&self) -> bool {
        let process = self.process.read().await;
        
        if let Some(child) = process.as_ref() {
            match child.try_wait() {
                Ok(Some(_)) => false, // Process has exited
                Ok(None) => true,     // Process is still running
                Err(_) => false,      // Error checking status
            }
        } else {
            false
        }
    }
    
    async fn wait_for_ready(&self) -> Result<(), SubprocessError> {
        let timeout = std::time::Duration::from_secs(30);
        let start = std::time::Instant::now();
        
        while start.elapsed() < timeout {
            // Send ping command to check if conductor is ready
            let ping_cmd = serde_json::json!({
                "command": "ping"
            });
            
            if let Ok(response) = self.send_command_with_response(ping_cmd).await {
                if response.get("status") == Some(&serde_json::Value::String("ready".to_string())) {
                    return Ok(());
                }
            }
            
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        }
        
        Err(SubprocessError::StartupTimeout)
    }
    
    async fn send_command_with_response(&self, command: serde_json::Value) -> Result<serde_json::Value, SubprocessError> {
        // Implementation would send command via stdin and wait for response via stdout
        // This is a simplified version - full implementation would handle JSON-RPC protocol
        todo!("Implement command/response protocol with Python subprocess")
    }
    
    async fn start_health_monitoring(&self) {
        let manager = self.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
            
            loop {
                interval.tick().await;
                
                if !manager.is_running().await {
                    tracing::error!("Python Conductor process died unexpectedly");
                    let _ = manager.status_sender.send(SubprocessStatus::Died);
                    
                    // Attempt automatic restart
                    if let Err(e) = manager.restart_conductor().await {
                        tracing::error!("Failed to restart Python Conductor: {}", e);
                        let _ = manager.status_sender.send(SubprocessStatus::RestartFailed(e.to_string()));
                    }
                    
                    break;
                }
            }
        });
    }
}

#[derive(Debug, Clone)]
pub struct PythonConfig {
    pub python_executable: PathBuf,
    pub python_path: String,
    pub args: Vec<String>,
    pub working_directory: Option<PathBuf>,
    pub environment: HashMap<String, String>,
    pub startup_timeout: std::time::Duration,
}

impl Default for PythonConfig {
    fn default() -> Self {
        Self {
            python_executable: PathBuf::from("python3"),
            python_path: std::env::var("PYTHONPATH").unwrap_or_default(),
            args: Vec::new(),
            working_directory: None,
            environment: HashMap::new(),
            startup_timeout: std::time::Duration::from_secs(30),
        }
    }
}

#[derive(Debug, Clone)]
pub enum SubprocessStatus {
    Started,
    Stopped,
    Died,
    Restarted,
    RestartFailed(String),
}
```

## Performance Considerations

### FFI Performance Optimization
- **Call Overhead**: Target <0.01ms for FFI calls through optimized PyO3 usage
- **Type Conversion**: Minimize allocations in type conversion paths
- **Memory Management**: Use `py.allow_threads()` for CPU-intensive operations
- **Batch Operations**: Group multiple operations to reduce FFI overhead

### Memory Safety
- **Reference Counting**: Proper Python object reference management
- **Memory Leaks**: Automatic cleanup of Python objects in Rust
- **Thread Safety**: Safe access to Python objects from Rust threads
- **Resource Cleanup**: Proper cleanup on subprocess termination

### Error Handling Strategy

### Error Categories
1. **FFI Errors**: Type conversion failures, Python exceptions, memory errors
2. **Subprocess Errors**: Process startup failures, communication errors, crashes
3. **Async Errors**: Event loop integration issues, cancellation errors
4. **System Errors**: Resource exhaustion, permission issues, configuration errors

### Recovery Mechanisms
- **Graceful Degradation**: Continue operation without Python integration if needed
- **Automatic Restart**: Restart Python subprocess on failures
- **Error Propagation**: Preserve error context across language boundary
- **Resource Cleanup**: Automatic cleanup of resources on failures

---

**Design Complete**: Ready for TESTING phase