const config = require('./config/index');
const User = require('./src/user');
const App = require('./src/app.js');

let u = {
  id: 1111,
  username: 'usernametest111111111',
  name: "UserName11111111",
  bot: false,
  date: 'date'
}

let a = new App(config);
a.checkUser(u);
a.addReg(u, 1, 123456)



