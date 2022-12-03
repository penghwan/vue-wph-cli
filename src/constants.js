// 存放用户的变量
// wph-cli版本号
const { version } = require('../package.json');
// 临时目录
const downloadDirectory = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template` // darwin表示Mac系统

module.exports = {
  version,
  downloadDirectory
}