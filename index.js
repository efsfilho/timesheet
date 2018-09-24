const config = require('./config/index');
const User = require('./src/user');
const App = require('./src/app.js');

// let u = {
//   id: 1111,
//   username: 'usertest11',
//   name: "UserName11",
//   bot: false,
//   date: 'date'
// }
let u = { id: 245166578,
  username: 'efsfilho',
  name: 'Eduardo Filho',
  bot: false,
  date: 1537300857 }

let a = new App(config);

// a.syncUser(u);
// a.export();
// console.log(a);
// a.addReg(u, 4, 1537291265)
// a.getReg(1537291265).then(res => console.log(res));
const Bot = require('./src/bot');
