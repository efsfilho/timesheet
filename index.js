const config = require('./config/index');

const App = require('./src/app.js');
const User = require('./src/user.js');


// let a = new App();
// a.saveFile(a.createStructure(), './struct.json');
// a.readFile('./struct.json', (d) => { console.log(d) })
// console.log(a.existsFile('./struct.json'));
// a.saveFile({ teste: 'fdsfdsf'}, './teste.json');

// a.saveReg('./struct.json', 3, 1534284954);
// a.export('./struct.json');

let u = {
  id: 0,
  username: 'usernametest',
  name: "UserName",
  bot: false,
  date: 'date'
}

let user = new User(u, config);

