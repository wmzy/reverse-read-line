module.exports = {
  extension: ['js', 'ts', 'tsx'],
  recursive: true,
  exclude: ['mock', 'typings', 'fixtures'],
  require: ['should', 'should-sinon', '@babel/register']
}
