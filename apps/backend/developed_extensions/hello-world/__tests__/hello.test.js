const helloWorld = require('..');

describe('Hello World Extension', () => {
  test('should activate successfully', () => {
    const result = helloWorld.onActivate();
    expect(result).toBeUndefined();
  });

  test('should respond to hello command', () => {
    const response = helloWorld.commands.hello();
    expect(response).toEqual({
      success: true,
      message: 'تم تنفيذ الأمر بنجاح'
    });
  });

  test('should deactivate successfully', () => {
    const result = helloWorld.onDeactivate();
    expect(result).toBeUndefined();
  });
});
