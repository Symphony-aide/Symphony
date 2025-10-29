const fs = require('fs');
const path = require('path');
const fileCounter = require('..');

// إنشاء مجلد تجريبي للاختبار
const testDir = path.join(__dirname, 'test-dir');

beforeAll(() => {
  // إنشاء مجلد تجريبي مع ملفات وهمية
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
    ['file1.txt', 'file2.txt', 'file3.txt'].forEach(file => {
      fs.writeFileSync(path.join(testDir, file), 'test');
    });
  }
});
afterAll(() => {
  // تنظيف بعد الانتهاء من الاختبارات
  if (fs.existsSync(testDir)) {
    fs.readdirSync(testDir).forEach(file => {
      fs.unlinkSync(path.join(testDir, file));
    });
    fs.rmdirSync(testDir);
  }
});

describe('File Counter Extension', () => {
  test('should count files in directory', async () => {
    const result = await fileCounter.commands['count-files'](testDir);
    expect(result).toMatchObject({
      success: true,
      count: 3,
      message: expect.stringContaining('تم العثور على 3 ملف')
    });
  });

  test('should handle non-existent directory', async () => {
    const result = await fileCounter.commands['count-files']('/non/existent/path');
    expect(result).toMatchObject({
      success: false,
      error: 'حدث خطأ أثناء عد الملفات'
    });
  });
});
