const commandPalette = require('..');

describe('Command Palette Extension', () => {
  test('should return current time', () => {
    const result = commandPalette.commands.time();
    expect(result).toMatchObject({
      success: true,
      message: 'الوقت الحالي'
    });
    // التأكد من أن الوقت في النتيجة
    expect(result.time).toBeDefined();
  });

  test('should greet with default name', () => {
    const result = commandPalette.commands.greet();
    expect(result).toEqual({
      success: true,
      message: 'مرحباً عزيزي المستخدم!'
    });
  });

  test('should greet with provided name', () => {
    const result = commandPalette.commands.greet('أحمد');
    expect(result).toEqual({
      success: true,
      message: 'مرحباً أحمد!'
    });
  });
});
