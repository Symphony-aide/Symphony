# Phase 2: IPC Translation Layer - دليل عملي مبسط

## 📚 نظرة عامة

Phase 2 هدفها إنشاء "جسر" بين Symphony والـ Xi-Core. تخيل إنك بتترجم بين لغتين مختلفتين.

```
Frontend (Monaco)  →  Symphony IPC  →  IpcBridge  →  Xi-Core
                                          ↑
                                    المترجم اللي هنبنيه
```

---

## 🎯 Task 5: IPC Bridge - المترجم

### 5.1 إنشاء IpcBridge struct

**الملف:** `apps/backend/xi_integration/src/ipc_bridge.rs`

**الكود الأساسي:**

```rust
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{XiIntegration, XiResult, ViewId, EditOperation};
use crate::types::{SymphonyIpcRequest, SymphonyIpcResponse};

/// IPC Bridge - المترجم بين Symphony و Xi-Core
///
/// هذا الـ struct بيستقبل رسائل من Symphony ويترجمها لعمليات Xi-Core
pub struct IpcBridge {
    /// مرجع لـ XiIntegration
    xi: Arc<Mutex<XiIntegration>>,
}

impl IpcBridge {
    /// إنشاء IpcBridge جديد
    pub fn new(xi: Arc<Mutex<XiIntegration>>) -> Self {
        tracing::info!("Initializing IPC Bridge");
        Self { xi }
    }
}
```

**شرح:**
- `IpcBridge` ببساطة بيمسك `XiIntegration` ويستخدمه
- `Arc<Mutex<>>` عشان نقدر نستخدمه من threads مختلفة بأمان

---

### 5.2 ترجمة الرسائل من Symphony → Xi

**الفكرة:** لما Symphony يبعت رسالة، نترجمها لعملية Xi-Core

#### مثال 1: فتح ملف

```rust
impl IpcBridge {
    /// معالجة رسالة من Symphony
    pub async fn handle_request(
        &self,
        request: SymphonyIpcRequest
    ) -> XiResult<SymphonyIpcResponse> {
        match request {
            // لما Symphony يقول "افتح ملف"
            SymphonyIpcRequest::OpenFile { path } => {
                tracing::info!("Opening file: {:?}", path);
                
                // نفتح الملف في Xi-Core
                let view_id = self.xi.lock().await.open_file(&path).await?;
                
                // نرجع رد لـ Symphony
                Ok(SymphonyIpcResponse::ViewOpened { view_id })
            }
            
            // باقي الرسائل...
            _ => self.handle_other_requests(request).await,
        }
    }
}
```

**شرح خطوة بخطوة:**
1. Symphony يبعت: `OpenFile { path: "example.txt" }`
2. IpcBridge يستقبل الرسالة
3. IpcBridge يقول لـ Xi-Core: `open_file("example.txt")`
4. Xi-Core يفتح الملف ويرجع `ViewId(1)`
5. IpcBridge يرجع لـ Symphony: `ViewOpened { view_id: ViewId(1) }`

#### مثال 2: تعديل نص

```rust
impl IpcBridge {
    async fn handle_other_requests(
        &self,
        request: SymphonyIpcRequest
    ) -> XiResult<SymphonyIpcResponse> {
        match request {
            // لما Symphony يقول "اعمل edit"
            SymphonyIpcRequest::Edit { view_id, operation } => {
                tracing::info!("Editing view {:?}", view_id);
                
                // نطبق التعديل في Xi-Core
                self.xi.lock().await.edit(view_id, operation).await?;
                
                // نرجع رد لـ Symphony
                Ok(SymphonyIpcResponse::EditApplied { view_id })
            }
            
            // لما Symphony يقول "اجيب المحتوى"
            SymphonyIpcRequest::GetContent { view_id } => {
                tracing::info!("Getting content for view {:?}", view_id);
                
                // نجيب المحتوى من Xi-Core
                let content = self.xi.lock().await.get_content(view_id).await?;
                
                // نرجع المحتوى لـ Symphony
                Ok(SymphonyIpcResponse::Content { view_id, content })
            }
            
            // لما Symphony يقول "اقفل الملف"
            SymphonyIpcRequest::CloseView { view_id } => {
                tracing::info!("Closing view {:?}", view_id);
                
                // نقفل الـ view في Xi-Core
                self.xi.lock().await.close_view(view_id).await?;
                
                // نرجع رد لـ Symphony
                Ok(SymphonyIpcResponse::ViewClosed { view_id })
            }
            
            // باقي الرسائل (Save, Undo, Redo, Search)
            _ => {
                tracing::warn!("Unhandled request: {:?}", request);
                Ok(SymphonyIpcResponse::Error {
                    message: "Not implemented yet".to_string(),
                })
            }
        }
    }
}
```

#### مثال 3: معالجة الأخطاء

```rust
impl IpcBridge {
    /// معالجة رسالة مع error handling
    pub async fn handle_request_safe(
        &self,
        request: SymphonyIpcRequest
    ) -> SymphonyIpcResponse {
        match self.handle_request(request).await {
            Ok(response) => response,
            Err(error) => {
                tracing::error!("Error handling request: {}", error);
                SymphonyIpcResponse::Error {
                    message: error.to_string(),
                }
            }
        }
    }
}
```

---

### 5.3 إضافة IpcBridge للـ module

**الملف:** `apps/backend/xi_integration/src/lib.rs`

```rust
// في أول الملف، أضف:
pub mod ipc_bridge;

// في Re-exports section، أضف:
pub use ipc_bridge::IpcBridge;
```

---

### 5.4 اختبار IpcBridge

**الملف:** `apps/backend/xi_integration/src/ipc_bridge.rs` (في نهاية الملف)

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::XiConfig;

    #[tokio::test]
    async fn test_ipc_bridge_open_file() {
        // إنشاء Xi integration
        let xi = Arc::new(Mutex::new(
            XiIntegration::new(XiConfig::default()).unwrap()
        ));
        
        // إنشاء IPC Bridge
        let bridge = IpcBridge::new(xi);
        
        // إرسال رسالة OpenFile
        let request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };
        
        let response = bridge.handle_request(request).await.unwrap();
        
        // التحقق من الرد
        match response {
            SymphonyIpcResponse::ViewOpened { view_id } => {
                assert_eq!(view_id.0, 1);
            }
            _ => panic!("Expected ViewOpened response"),
        }
    }

    #[tokio::test]
    async fn test_ipc_bridge_edit() {
        let xi = Arc::new(Mutex::new(
            XiIntegration::new(XiConfig::default()).unwrap()
        ));
        let bridge = IpcBridge::new(xi.clone());
        
        // فتح ملف أولاً
        let open_request = SymphonyIpcRequest::OpenFile {
            path: "test.txt".into(),
        };
        let open_response = bridge.handle_request(open_request).await.unwrap();
        
        let view_id = match open_response {
            SymphonyIpcResponse::ViewOpened { view_id } => view_id,
            _ => panic!("Expected ViewOpened"),
        };
        
        // تعديل الملف
        let edit_request = SymphonyIpcRequest::Edit {
            view_id,
            operation: EditOperation::Insert {
                position: 0,
                text: "Hello, World!".to_string(),
            },
        };
        
        let edit_response = bridge.handle_request(edit_request).await.unwrap();
        
        // التحقق من الرد
        match edit_response {
            SymphonyIpcResponse::EditApplied { .. } => {
                // نجح!
            }
            _ => panic!("Expected EditApplied response"),
        }
        
        // التحقق من المحتوى
        let content = xi.lock().await.get_content(view_id).await.unwrap();
        assert_eq!(content, "Hello, World!");
    }
}
```

---

## 🗂️ Task 6: Buffer Manager - مدير الملفات

### 6.1 إنشاء BufferManager struct

**الملف:** `apps/backend/xi_integration/src/buffer_manager.rs`

```rust
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;
use crate::{XiIntegration, XiResult, ViewId, BufferMetadata};

/// Buffer Manager - يتابع الملفات المفتوحة
///
/// يمنع فتح نفس الملف مرتين ويتابع معلومات كل buffer
pub struct BufferManager {
    /// خريطة: مسار الملف → ViewId
    path_to_view: HashMap<PathBuf, ViewId>,
    
    /// خريطة: ViewId → معلومات الـ buffer
    view_metadata: HashMap<ViewId, BufferMetadata>,
    
    /// مرجع لـ XiIntegration
    xi: Arc<Mutex<XiIntegration>>,
}

impl BufferManager {
    /// إنشاء BufferManager جديد
    pub fn new(xi: Arc<Mutex<XiIntegration>>) -> Self {
        tracing::info!("Initializing Buffer Manager");
        Self {
            path_to_view: HashMap::new(),
            view_metadata: HashMap::new(),
            xi,
        }
    }
}
```

---

### 6.2 فتح الملفات بذكاء (منع التكرار)

```rust
impl BufferManager {
    /// فتح ملف (أو إرجاع الـ ViewId الموجود)
    ///
    /// لو الملف مفتوح بالفعل، يرجع نفس الـ ViewId
    /// لو الملف مش مفتوح، يفتحه ويرجع ViewId جديد
    pub async fn open_buffer(&mut self, path: PathBuf) -> XiResult<ViewId> {
        // تحقق: هل الملف مفتوح بالفعل؟
        if let Some(&view_id) = self.path_to_view.get(&path) {
            tracing::info!("File {:?} already open with ViewId {:?}", path, view_id);
            return Ok(view_id);
        }
        
        // الملف مش مفتوح، نفتحه الآن
        tracing::info!("Opening new file: {:?}", path);
        let view_id = self.xi.lock().await.open_file(&path).await?;
        
        // نسجل الملف في الخرائط
        self.path_to_view.insert(path.clone(), view_id);
        
        // نجيب معلومات الـ buffer
        let metadata = self.xi.lock().await.get_metadata(view_id)?;
        self.view_metadata.insert(view_id, metadata);
        
        Ok(view_id)
    }
    
    /// إغلاق ملف وإزالته من التتبع
    pub async fn close_buffer(&mut self, view_id: ViewId) -> XiResult<()> {
        tracing::info!("Closing buffer {:?}", view_id);
        
        // إزالة من الخرائط
        if let Some(metadata) = self.view_metadata.remove(&view_id) {
            if let Some(path) = metadata.path {
                self.path_to_view.remove(&path);
            }
        }
        
        // إغلاق في Xi-Core
        self.xi.lock().await.close_view(view_id).await?;
        
        Ok(())
    }
    
    /// التحقق: هل الملف مفتوح؟
    pub fn is_open(&self, path: &PathBuf) -> bool {
        self.path_to_view.contains_key(path)
    }
    
    /// الحصول على ViewId لملف مفتوح
    pub fn get_view_id(&self, path: &PathBuf) -> Option<ViewId> {
        self.path_to_view.get(path).copied()
    }
    
    /// الحصول على معلومات buffer
    pub fn get_metadata(&self, view_id: ViewId) -> Option<&BufferMetadata> {
        self.view_metadata.get(&view_id)
    }
    
    /// الحصول على قائمة بكل الملفات المفتوحة
    pub fn list_open_files(&self) -> Vec<PathBuf> {
        self.path_to_view.keys().cloned().collect()
    }
}
```

---

### 6.3 اختبار BufferManager

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use crate::XiConfig;

    #[tokio::test]
    async fn test_buffer_manager_open_once() {
        let xi = Arc::new(Mutex::new(
            XiIntegration::new(XiConfig::default()).unwrap()
        ));
        let mut manager = BufferManager::new(xi);
        
        let path = PathBuf::from("test.txt");
        
        // فتح الملف أول مرة
        let view_id1 = manager.open_buffer(path.clone()).await.unwrap();
        
        // فتح نفس الملف مرة تانية
        let view_id2 = manager.open_buffer(path.clone()).await.unwrap();
        
        // يجب أن يكون نفس الـ ViewId
        assert_eq!(view_id1, view_id2);
    }

    #[tokio::test]
    async fn test_buffer_manager_multiple_files() {
        let xi = Arc::new(Mutex::new(
            XiIntegration::new(XiConfig::default()).unwrap()
        ));
        let mut manager = BufferManager::new(xi);
        
        // فتح ملفات مختلفة
        let view_id1 = manager.open_buffer("file1.txt".into()).await.unwrap();
        let view_id2 = manager.open_buffer("file2.txt".into()).await.unwrap();
        let view_id3 = manager.open_buffer("file3.txt".into()).await.unwrap();
        
        // يجب أن تكون ViewIds مختلفة
        assert_ne!(view_id1, view_id2);
        assert_ne!(view_id2, view_id3);
        assert_ne!(view_id1, view_id3);
        
        // التحقق من القائمة
        let open_files = manager.list_open_files();
        assert_eq!(open_files.len(), 3);
    }

    #[tokio::test]
    async fn test_buffer_manager_close() {
        let xi = Arc::new(Mutex::new(
            XiIntegration::new(XiConfig::default()).unwrap()
        ));
        let mut manager = BufferManager::new(xi);
        
        let path = PathBuf::from("test.txt");
        
        // فتح ملف
        let view_id = manager.open_buffer(path.clone()).await.unwrap();
        assert!(manager.is_open(&path));
        
        // إغلاق الملف
        manager.close_buffer(view_id).await.unwrap();
        assert!(!manager.is_open(&path));
    }
}
```

---

### 6.4 إضافة BufferManager للـ module

**الملف:** `apps/backend/xi_integration/src/lib.rs`

```rust
// في أول الملف، أضف:
pub mod buffer_manager;

// في Re-exports section، أضف:
pub use buffer_manager::BufferManager;
```

---

## ✅ Task 7: Checkpoint - اختبار كل شيء

### تشغيل الاختبارات

```bash
cd apps/backend
cargo test --package xi-integration
```

### النتيجة المتوقعة

```
running 17 tests  # (11 من Phase 1 + 6 جديدة)
test ipc_bridge::tests::test_ipc_bridge_open_file ... ok
test ipc_bridge::tests::test_ipc_bridge_edit ... ok
test buffer_manager::tests::test_buffer_manager_open_once ... ok
test buffer_manager::tests::test_buffer_manager_multiple_files ... ok
test buffer_manager::tests::test_buffer_manager_close ... ok
... (باقي الاختبارات)

test result: ok. 17 passed; 0 failed
```

---

## 📊 ملخص Phase 2

### ما أنجزناه:

1. ✅ **IpcBridge** - مترجم بين Symphony و Xi-Core
   - يستقبل رسائل Symphony
   - يترجمها لعمليات Xi-Core
   - يرجع الردود لـ Symphony

2. ✅ **BufferManager** - مدير الملفات الذكي
   - يتابع الملفات المفتوحة
   - يمنع فتح نفس الملف مرتين
   - يدير دورة حياة الـ buffers

3. ✅ **Tests** - اختبارات شاملة
   - اختبارات IpcBridge
   - اختبارات BufferManager
   - كل الاختبارات تنجح

### الملفات الجديدة:

```
apps/backend/xi_integration/
├── src/
│   ├── lib.rs              (محدث)
│   ├── types.rs            (موجود)
│   ├── error.rs            (موجود)
│   ├── ipc_bridge.rs       (جديد) ✨
│   └── buffer_manager.rs   (جديد) ✨
└── Cargo.toml              (موجود)
```

### جاهز للمرحلة التالية:

الآن عندك البنية التحتية الكاملة للتواصل بين Symphony و Xi-Core!

**Phase 3** سيكون أسهل لأنه TypeScript/React (Frontend Integration)

---

## 🎓 نصائح للتنفيذ

1. **ابدأ بـ IpcBridge:**
   - انسخ الكود من الأمثلة
   - اختبر كل function على حدة
   - تأكد من الاختبارات تنجح

2. **بعدين BufferManager:**
   - نفس الطريقة
   - ركز على منطق منع التكرار
   - اختبر سيناريوهات مختلفة

3. **لو واجهت مشكلة:**
   - اقرأ رسالة الخطأ بعناية
   - تحقق من الـ types
   - استخدم `tracing::info!` للـ debugging

4. **بعد ما تخلص:**
   - شغل كل الاختبارات
   - تأكد كلها تنجح
   - اعمل commit و push

---

## 🚀 الخطوة التالية

بعد ما تخلص Phase 2، هتكون جاهز لـ:

**Phase 3: Frontend Integration**
- ربط Monaco Editor بـ Xi-Core
- أسهل لأنها TypeScript/React
- هتستخدم IpcBridge اللي بنيته

**أو Phase 4: Advanced Features**
- Undo/Redo
- Search/Replace
- Multi-cursor
- كلها واضحة ومباشرة

---

**هل محتاج توضيح أكثر في أي جزء؟** 🤔
