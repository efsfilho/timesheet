const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json');

const getFireStore = () => {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  return admin.firestore();
}
const fireStore = getFireStore();

class FireStore {
  // constructor() {
  //   this._fireStore = getFireStore();
  // }

  // setUser(user) {
  //   return this._fireStore.collection('users')
  //     .doc(user.id)
  //     .set(user);
  // }

  // getUser(user) {
  //   return new Promise((resolve, reject) => {
  //     this._fireStore.collection('users')
  //       .doc(user.id)
  //       .get()
  //       .then(userDoc => {
  //         if (!userDoc.exists) {
  //           resolve(null);
  //         } else {
  //           resolve(userDoc.data());
  //         }
  //       })
  //       .catch(err => reject(err));
  //   });
  // }
  static setUser(user) {
    return fireStore.collection('users')
      .doc(user.id)
      .set(user);
  }

  static getUsers() {
    return new Promise((resolve, reject) => {
      fireStore.collection('users')
        .get()
        .then(usersData => {
          if (usersData.empty) {
            resolve([]);
          } else {
            resolve(usersData);
          }
        })
        .catch(err => reject(err));
    });
  }
  
  static getRegs(userId, year) {
    return new Promise((resolve, reject) => {
      const item = `${userId}_${year}`;
      console.log(item)
      fireStore.collection('registers')
        .doc(item)
        .get()
        .then(regsData => {
          if (!regsData.exists) {
            resolve(null);
          } else {
            resolve(regsData.data());
          }
        })
        .catch(err => reject(err));
    });
  }

  static setRegs(regs) {
    const regDoc = `${regs.userId}_${regs.regs.y}`;
    console.log(regDoc)
    return fireStore.collection('registers')
      .doc(regDoc)
      .set(regs)
  }
}

module.exports = FireStore;





// const admin = require('firebase-admin');

// // let serviceAccount = require('../accountFirebase.json');
// let serviceAccount = require('./serviceAccountKey.json');

// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

// let firestore = admin.firestore();

// let data = {
//   name: 'Los Angeles',
//   state: 'CA',
//   country: 'USA'
// };
// // Add a new document in collection "cities" with ID 'LA'
// // let setDoc = firestore.collection('cities').doc('LA').set(data).catch(err => console.log(err));

// // let query = firestore.collection('cities').where('state', '==', 'CA');
// // query.limit(1).get().then(querySnapshot => {
// //   querySnapshot.forEach(documentSnapshot => {
// //     console.log(`Found document at ${documentSnapshot.ref.path}`);
// //   });
// // }).catch(err => console.log(err));

// // let citiesRef = firestore.collection('cities').where('state', '==', 'CA').limit(1);
// // let query = citiesRef.get()
// //   .then(snapshot => {
// //     if (snapshot.empty) {
// //       console.log('No matching documents.');
// //       return;
// //     }
// //     snapshot.forEach(doc => {
// //       console.log(doc.id, '=>', doc.data());
// //     });
// //   })
// //   .catch(err => {
// //     console.log('Error getting documents', err);
// //   });


// // admin.app().database().goOffline();