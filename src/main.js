// 获取版本号
const program = require('commander')
const path = require('path')
const { version } = require('./constants')

// 配置3个指令
const mapActions = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: ['wph-cli create <project-name>']
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: ['wph-cli config set <k><v>', 'wph-cli config get <k>']
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: []
  }
}
// 循环创建命令
Reflect.ownKeys(mapActions).forEach(action => {
  program
    .command(action) // 配置命名的名称
    .alias(mapActions[action].alias) // 命令的别名
    .description(mapActions[action].description) // 命令对应的描述
    .action(() => {
      if (action === '*') {
        // 访问不到对应的命令
        console.log(mapActions[action].description)
      } else {
        // console.log(action)
        // 截取命令
        // wph-cli create <project-name>
        require(path.resolve(__dirname, action))(...process.argv.slice(3))
      }
    })
})
// 监听用户的help事件
program.on('--help', () => {
  console.log('\nExamples:')
  Reflect.ownKeys(mapActions).forEach(action => {
    mapActions[action].examples.forEach(example => {
      console.log(example);
    })
  })
})
program.version(version).parse(process.argv)