module.exports = function (api) {
  const isTest = api.env('test');

  return {
    presets: [
      [
        'babel-preset-expo',
        { jsxImportSource: isTest ? undefined : 'nativewind' },
      ],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
  };
};
