const path = require('path')
// fs是node下的文件操作，existsSync——检测路径是否存在
const exists = require('fs').existsSync
// 命令行加载效果
const ora = require('ora')
// 交互式命令行工具
const inquirer = require('inquirer')
const axios = require('axios')
// 包装promise方法
const { promisify } = require('util')
// 静态网页生成器
const Metalsmith = require('metalsmith')
// 从git中下载模板
let downloadGitRepo = require('download-git-repo')
// 实现文件的拷贝功能
let ncp = require('ncp')
// 模板引擎里解析渲染器
let { render } = require('consolidate').ejs
// 加载常量文件
const { downloadDirectory } = require('./constants')

// 将方法转化为promise方法
downloadGitRepo = promisify(downloadGitRepo)
ncp = promisify(ncp)
render = promisify(render)

// 封装loading
const waitFnLoading = (fn, message) => async (...args) => {
  const spinner = ora(message)
  spinner.start(); // 开始加载loading
  let list = await fn(...args)
  spinner.succeed() // 结束加载loading
  return list
}

// 获取github上的仓库模板
const fetchRepoList = async() => {
  // 获取仓库列表
  const { data } = await axios.get('https://api.github.com/orgs/td-cli/repos')
  return data
}

// 获取tag版本信息
const fetchTagList = async(repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/td-cli/${repo}/tags`)
  return data
}

// 下载项目模板
const downloadTemplate = async(template, tag) => {
  let api = `td-cli/${template}`
  if (tag) {
    api += `#${tag}` // td-cli/vue-template#4.0
  }
  const dest = `${downloadDirectory}/${template}` // C:\Users\penghwan/.template/vue-template
  await downloadGitRepo(api, dest)
  return dest
}

module.exports = async (projectName) => {
  // 1. 获取项目模板
  let templateList = await waitFnLoading(fetchRepoList, 'fectching template...')()
  templateList = templateList.map(item => item.name)
  // 选择模板
  const { template } = await inquirer.prompt({
    name: 'template', // 选择后的结果
    type: 'list', // 什么方式展现
    message: 'please choose a template to create project', // 提示信息
    choices: templateList // 选择的数据
  })
  
  // 2. 获取对应的版本号
  let tagList = await waitFnLoading(fetchTagList, 'fectching tags...')(template)
  tagList = tagList.map(item => item.name)
  // 选择版本号
  const { tag } = await inquirer.prompt({
    name: 'tag', // 选择后的结果
    type: 'list', // 什么方式展现
    message: 'please choose a tag to create project', // 提示信息
    choices: tagList // 选择的数据
  })
  
  // 3. 下载项目模板，返回一个临时的存放目录
  const dest = await waitFnLoading(downloadTemplate, 'downloading template...')(
    template,
    tag
  ) // dest ===> C:\Users\penghwan/.template/vue-template

  if (!exists(path.join(dest, 'ask.js'))) {
    // 不存在，即为简单模板
    await ncp(dest, path.resolve(projectName)) // path.resolve('vue-demo') ===> D:\code\vue\vue-wph-cli\vue-demo
  } else {
    // 复杂模板
    // 需要用户选择，选择后编译模板
    await new Promise((resolve, reject) => {
      Metalsmith(__dirname) // 如果传入路径，它就会默认遍历当前src下文件，__dirname ===> D:\code\vue\vue-wph-cli\src
        .source(dest) // 遍历模板文件
        .destination(path.resolve(projectName)) // 编译后去的地方
        .use(async (files, metalsmith, done) => {
          // files是所有的文件
          // 拿到提前配置好的信息，传下去渲染
          const args = require(path.join(dest, 'ask.js'))
          // 拿到了，让用户填写，返回填写信息
          const obj = await inquirer.prompt(args)
          const meta = metalsmith.metadata() // 获取的信息合并传入下一个use
          Object.assign(meta, obj)
          delete files['ask.js'] // 删除ask.js文件
          done()
        })
        .use((files, metalsmith, done) => {
          // 根据用户信息，渲染模板
          const obj = metalsmith.metadata()
          Reflect.ownKeys(files).forEach(async (file) => {
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString() // 文件内容
              // 判断是不是模板
              if (content.includes('<%')) {
                content = await render(content, obj)
                files[file].contents = Buffer.from(content) // 渲染
              }
            }
          })
          done()
        })
        .build(err => {
          if (err) {
            reject()
          } else {
            resolve()
          }
        })
    })
  }

}