const admin = require('firebase-admin');
const serviceAccount = require('../../../serviceAccountKey.json');

const getFireStore = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  return admin.firestore();
}
const fireStore = getFireStore();

class FireStore {
 
  static setUser(user) {
    return fireStore.collection('users')
      .doc(`${user.id}`)
      .set(user);
  }

  static getUsers() {
    return new Promise((resolve, reject) => {
      let users = [];
      fireStore.collection('users')
        .get()
        .then(data => {
          data.docs.forEach(user => users.push(user.data()));
          resolve(users);
        })
        .catch(err => reject(err));
    });
  }
  static getReg(userId, year) {
    return new Promise((resolve, reject) => {
      const item = `${userId}_${year}`;

      fireStore.collection('registers')
        .doc(item)
        .get()
        .then(regsData => {
          if (regsData.exists) {
            resolve(regsData.data());
          } else {
            reject(null);
          }
        })
        .catch(err => reject(err))

    });
  }

  static getRegs(userId, year) {
    return new Promise((resolve, reject) => {
      const item = `${userId}_${year}`;
      fireStore.collection('registers')
        .doc(item)
        .get()
        .then(regsData => {
          if (regsData.exists) {
            resolve(regsData.data());
          } else {
            resolve(null);
          }
        })
        .catch(err => reject(err));
    });
  }

  static setRegs(regs) {
    const regDoc = `${regs.userId}_${regs.regs.y}`;
    // console.log(regDoc)
    return fireStore.collection('registers')
      .doc(regDoc)
      .set(regs)
  }
}

module.exports = FireStore;
