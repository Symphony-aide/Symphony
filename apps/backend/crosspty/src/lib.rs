//! واجهة بسيطة للتعامل مع الطرفيات الوهمية

use std::io;

pub mod platforms;

/// حجم الطرفية (عرض، ارتفاع)
pub type PtySize = (u16, u16);

/// خطأ بسيط للطرفية
#[derive(Debug)]
pub enum PtyError {
    Io(io::Error),
    Other(String),
}

impl From<io::Error> for PtyError {
    fn from(err: io::Error) -> Self {
        PtyError::Io(err)
    }
}

/// تكوين بسيط للطرفية
pub struct PtyConfig {
    pub size: PtySize,
    pub shell: Option<String>,
}

impl Default for PtyConfig {
    fn default() -> Self {
        Self {
            size: (80, 24),
            shell: None,
        }
    }
}

/// إنشاء طرفية جديدة
pub fn create_pty(config: PtyConfig) -> Result<Box<dyn Pty>, PtyError> {
    #[cfg(windows)]
    return platforms::win::PtyWindows::new(config).map(|pty| Box::new(pty) as Box<dyn Pty>);
    
    #[cfg(unix)]
    return platforms::unix::PtyUnix::new(config).map(|pty| Box::new(pty) as Box<dyn Pty>);
}

/// واجهة الطرفية
#[async_trait::async_trait]
pub trait Pty: Send + Sync {
    /// إرسال بيانات للطرفية
    async fn write(&self, data: &str) -> Result<(), PtyError>;
    
    /// قراءة بيانات من الطرفية
    async fn read(&self, buf: &mut [u8]) -> Result<usize, PtyError>;
    
    /// تغيير حجم الطرفية
    async fn resize(&self, size: PtySize) -> Result<(), PtyError>;
    
    /// إغلاق الطرفية
    async fn close(&self) -> Result<(), PtyError>;
}
