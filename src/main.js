// 命令行处理工具
const program = require('commander')
const path = require('path')
// 获取版本号
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
// Reflect.ownKeys()：用于返回对象的所有属性，基本等同于Object.getOwnPropertyNames与Object.getOwnPropertySymbols之和
// Reflect.ownKeys(mapActions) => ['create', 'config', '*']
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
        // 输入命令：wph-cli create <project-name>
        // path.resolve(__dirname, action)：加载create.js文件
        // process.argv.slice(3): <project-name>
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

// program.version()：可以设置版本，其默认选项为-V和--version，设置了版本后，命令行会输出当前的版本号
program.version(version).parse(process.argv)