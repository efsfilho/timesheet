const config = require('./config/index');
const User = require('./src/user');
const App = require('./src/app.js');

let u = {
  id: 1111,
  username: 'usertest11',
  name: "UserName11",
  bot: false,
  date: 'date'
}
let a = new App(config);
a.syncUser(u);
// a.export();
// console.log(a);
// a.addReg(u, 4, 1536157901)
